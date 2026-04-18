import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchCleanDiff } from '@/lib/github';
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

    // 5. Score the diff with Claude 3.5 Sonnet
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

    // 6. Persist the engineer report
    const { data: report, error: reportError } = await supabase
      .from('engineer_reports')
      .insert([{
        bounty_id: bountyId,
        developer_handle: developerHandle,
        grit_score: score.gritScore,
        red_flags: score.redFlags,
        justification: score.justification,
      }])
      .select()
      .single();

    if (reportError) {
      console.error('Failed to persist engineer report:', reportError);
    }

    // 7. Final log
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
