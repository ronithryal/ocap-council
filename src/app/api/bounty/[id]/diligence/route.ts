import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  fetchCleanDiff,
  parseGitHubUrl,
  getPullRequestMetadata,
  listPullRequestFiles,
  getCommitMetadata,
  assessArtifactSignal,
} from '@/lib/github';
import { scoreForensicDiff } from '@/lib/forensic-scorer';

/**
 * POST /api/bounty/[id]/diligence
 *
 * The OCAP V2 Forensic Diligence Pipeline.
 *
 * Request body: { vendorId: string }  (OR { smokingGunUrl, developerHandle })
 *
 * Flow:
 *   1. Resolve the target vendor (developer handle + smoking_gun_url).
 *   2. Pull the raw .diff from GitHub, strip boilerplate, truncate if huge.
 *   3. Run Claude 3.5 Sonnet against the Grit-vs-Slop rubric.
 *   4. Persist the ForensicScore to `engineer_reports`.
 *   5. Log phase transitions into `agent_logs`.
 *
 * Response: { reportId, score, fileCoverage }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bountyId } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json().catch(() => ({} as any));
    const { vendorId, smokingGunUrl: overrideUrl, developerHandle: overrideHandle } = body;

    // 1. Resolve the smoking-gun URL and developer handle
    let smokingGunUrl: string;
    let developerHandle: string;

    if (overrideUrl && overrideHandle) {
      smokingGunUrl = overrideUrl;
      developerHandle = overrideHandle;
    } else {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .eq('bounty_id', bountyId)
        .single();

      if (vendorError || !vendor) {
        return NextResponse.json(
          { error: 'Vendor not found for bounty', details: vendorError?.message },
          { status: 404 }
        );
      }

      if (!vendor.github_url) {
        return NextResponse.json(
          { error: 'Vendor has no smoking_gun github_url to analyze' },
          { status: 400 }
        );
      }

      smokingGunUrl = vendor.github_url;
      developerHandle = vendor.name;
    }

    // 2. Pull bounty context for the scorer (optional but useful)
    const { data: bounty } = await supabase
      .from('bounties')
      .select('description, title')
      .eq('id', bountyId)
      .single();

    // 3. Transition agent phase → vetting (diligence-phase)
    await supabase
      .from('bounties')
      .update({ agent_phase: 'vetting' })
      .eq('id', bountyId);

    await supabase.from('agent_logs').insert([{
      bounty_id: bountyId,
      phase: 'vetting',
      message: `Forensic Pipeline engaged. Pulling raw diff from ${smokingGunUrl}...`,
      metadata: { smokingGunUrl, developerHandle },
    }]);

    // 4. Fetch + strip + truncate the GitHub diff
    const {
      cleanDiff,
      parsed,
      droppedFiles,
      keptFiles,
      truncated,
      originalBytes,
    } = await fetchCleanDiff(smokingGunUrl);

    if (!cleanDiff || cleanDiff.trim().length === 0) {
      throw new Error('Fetched diff was empty after stripping boilerplate');
    }

    await supabase.from('agent_logs').insert([{
      bounty_id: bountyId,
      phase: 'vetting',
      message: `Diff extracted. ${keptFiles.length} files kept, ${droppedFiles.length} boilerplate dropped. ${truncated ? `(truncated from ${originalBytes}B)` : `${originalBytes}B`}`,
      metadata: { keptFiles: keptFiles.slice(0, 20), droppedFiles: droppedFiles.slice(0, 20), truncated },
    }]);

    // 5. Deterministic prefilter — reject weak artifacts before any Claude call
    const parsedUrl = parseGitHubUrl(smokingGunUrl);

    if (parsedUrl.kind === 'repo' || parsedUrl.kind === 'unknown') {
      await supabase.from('agent_logs').insert([{
        bounty_id: bountyId,
        phase: 'vetting',
        message: `Prefilter rejected: artifact URL is not a PR or commit (kind="${parsedUrl.kind}"). Only PR and commit URLs are valid evidence artifacts.`,
        metadata: { smokingGunUrl, kind: parsedUrl.kind },
      }]);
      return NextResponse.json(
        {
          error: 'Artifact must be a PR or commit URL — repo-root and profile URLs are not valid evidence.',
          kind: parsedUrl.kind,
          smokingGunUrl,
        },
        { status: 400 },
      );
    }

    let signalReport;
    try {
      if (parsedUrl.kind === 'pull') {
        const [prMeta, prFiles] = await Promise.all([
          getPullRequestMetadata(parsedUrl.owner, parsedUrl.repo, parsedUrl.number),
          listPullRequestFiles(parsedUrl.owner, parsedUrl.repo, parsedUrl.number),
        ]);
        signalReport = assessArtifactSignal(prFiles, {
          additions: prMeta.additions,
          deletions: prMeta.deletions,
          changed_files: prMeta.changed_files,
          title: prMeta.title,
          draft: prMeta.draft,
        });
      } else {
        const commitMeta = await getCommitMetadata(parsedUrl.owner, parsedUrl.repo, parsedUrl.sha);
        signalReport = assessArtifactSignal(commitMeta.files, {
          additions: commitMeta.stats.additions,
          deletions: commitMeta.stats.deletions,
          message: commitMeta.commit.message.split('\n')[0],
        });
      }
    } catch (metaErr: any) {
      await supabase.from('agent_logs').insert([{
        bounty_id: bountyId,
        phase: 'vetting',
        message: `Prefilter: GitHub metadata fetch failed — ${metaErr.message}. Proceeding without signal check.`,
        metadata: { smokingGunUrl },
      }]);
      // Non-fatal: if metadata fetch fails (e.g., private repo), skip the gate and let diff scoring proceed
      signalReport = null;
    }

    if (signalReport && !signalReport.pass) {
      await supabase.from('agent_logs').insert([{
        bounty_id: bountyId,
        phase: 'vetting',
        message: `Prefilter rejected artifact: ${signalReport.reason}. Rejections: [${signalReport.rejections.join(', ')}]. No scorer call made.`,
        metadata: { smokingGunUrl, signalReport },
      }]);
      return NextResponse.json(
        {
          error: `Artifact rejected by deterministic prefilter: ${signalReport.reason}`,
          rejections: signalReport.rejections,
          signals: signalReport.signals,
          smokingGunUrl,
        },
        { status: 400 },
      );
    }

    if (signalReport?.pass) {
      await supabase.from('agent_logs').insert([{
        bounty_id: bountyId,
        phase: 'vetting',
        message: `Prefilter passed. Signals: [${signalReport.signals.join(', ') || 'none'}]. Proceeding to forensic scorer.`,
        metadata: { smokingGunUrl, signalReport },
      }]);
    }

    // 6. Score the diff with Claude 3.5 Sonnet
    await supabase.from('agent_logs').insert([{
      bounty_id: bountyId,
      phase: 'vetting',
      message: 'Dispatching Forensic Scorer (Claude 3.5 Sonnet) against the Grit-vs-Slop rubric...',
    }]);

    const score = await scoreForensicDiff({
      developerHandle,
      smokingGunUrl,
      cleanDiff,
      bountyObjective: bounty?.description,
      keptFiles,
      droppedFiles,
    });

    // 7. Persist the engineer report (full ForensicScore shape)
    const { data: report, error: reportError } = await supabase
      .from('engineer_reports')
      .insert([{
        bounty_id: bountyId,
        developer_handle: developerHandle,
        smoking_gun_url: smokingGunUrl,
        grit_score: score.gritScore,
        archetype: score.archetype,
        dimensions: score.dimensions,
        grit_markers: score.gritMarkers,
        red_flags: score.redFlags,
        justification: score.justification,
        recommendation: score.recommendation,
      }])
      .select()
      .single();

    if (reportError) {
      console.error('Failed to persist engineer report:', reportError);
    }

    // 8. Final log
    await supabase.from('agent_logs').insert([{
      bounty_id: bountyId,
      phase: 'vetting',
      message: `Forensic Report complete. Archetype: ${score.archetype}. Grit: ${score.gritScore}/10. Call: ${score.recommendation}.`,
      metadata: {
        score,
        parsedUrl: parsed,
      },
    }]);

    return NextResponse.json({
      reportId: report?.id ?? null,
      score,
      fileCoverage: {
        keptFiles,
        droppedFiles,
        truncated,
        originalBytes,
      },
      parsedUrl: parsed,
    });
  } catch (error: any) {
    console.error('Diligence pipeline error:', error);

    try {
      await supabase.from('agent_logs').insert([{
        bounty_id: bountyId,
        phase: 'failed',
        message: `Forensic Pipeline failed: ${error.message}`,
      }]);
    } catch {}

    return NextResponse.json(
      { error: error.message ?? 'Forensic Pipeline failed' },
      { status: 500 }
    );
  }
}
