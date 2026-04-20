import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchPerplexityPool, buildTaskFromBounty } from '@/lib/perplexity';
import {
  parseGitHubUrl,
  getPullRequestMetadata,
  listPullRequestFiles,
  getCommitMetadata,
  assessArtifactSignal,
  type ArtifactSignalReport,
} from '@/lib/github';

/**
 * POST /api/bounty/[id]/dispatch
 * 
 * Dispatches the Perplexity Computer Agent to autonomously search, vet,
 * and recommend vendors for the given bounty. Updates the database with
 * real-time phase transitions and logs throughout the process.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch the bounty details
    const { data: bounty, error: fetchError } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }

    // 2. Mark as dispatching
    await supabase
      .from('bounties')
      .update({ agent_phase: 'dispatching', status: 'active' })
      .eq('id', id);

    await supabase.from('agent_logs').insert([{
      bounty_id: id,
      phase: 'dispatching',
      message: 'OCAP Council initialized. Hydrating requirements via Brockman Formula...',
    }]);

    // 3. Transition to navigating
    await supabase
      .from('bounties')
      .update({ agent_phase: 'navigating' })
      .eq('id', id);

    await supabase.from('agent_logs').insert([{
      bounty_id: id,
      phase: 'navigating',
      message: 'Perplexity Computer Agent dispatched. Searching live web for vendor candidates...',
    }]);

    // 4. Build the task and call Perplexity
    const task = buildTaskFromBounty({
      id,
      description: bounty.description,
      budget: bounty.budget,
      title: bounty.title,
      category: bounty.category,
    });

    // 5. Transition to vetting while Perplexity runs
    await supabase
      .from('bounties')
      .update({ agent_phase: 'vetting' })
      .eq('id', id);

    await supabase.from('agent_logs').insert([{
      bounty_id: id,
      phase: 'vetting',
      message: 'Perplexity discovery agent dispatched. Building candidate pool...',
    }]);

    // 6. Execute the live Perplexity call — returns a CandidatePool
    const pool = await dispatchPerplexityPool(task);

    if (pool.parseStatus === 'parse_error') {
      await supabase.from('agent_logs').insert([{
        bounty_id: id,
        phase: 'failed',
        message: 'Discovery agent returned malformed JSON — could not extract candidate pool.',
        metadata: { parseStatus: pool.parseStatus, rawSnippet: pool.rawAgentOutput.slice(0, 300) },
      }]);
      await supabase.from('bounties').update({ agent_phase: 'failed' }).eq('id', id);
      return NextResponse.json({
        error: 'Perplexity returned unparseable output',
        rawOutput: pool.rawAgentOutput,
      }, { status: 502 });
    }

    const validStubs = pool.stubs.filter((s) => s.artifact_url !== null);

    if (pool.parseStatus === 'zero_valid') {
      await supabase.from('agent_logs').insert([{
        bounty_id: id,
        phase: 'failed',
        message: `Discovery agent returned ${pool.rawCandidateCount} candidate(s) but none resolved to a valid PR or commit URL. All citations were repo-root, profile, or missing.`,
        metadata: { parseStatus: pool.parseStatus, searchSummary: pool.searchSummary },
      }]);
      await supabase.from('bounties').update({ agent_phase: 'failed' }).eq('id', id);
      return NextResponse.json({
        error: 'No valid PR or commit artifacts found in candidate pool',
        rawOutput: pool.rawAgentOutput,
      }, { status: 422 });
    }

    await supabase.from('agent_logs').insert([{
      bounty_id: id,
      phase: 'vetting',
      message: `Candidate pool received: ${validStubs.length} valid artifact(s) from ${pool.rawCandidateCount} total. Running deterministic signal filter per artifact...`,
      metadata: { parseStatus: pool.parseStatus, searchSummary: pool.searchSummary },
    }]);

    // 7. Signal-filter each stub and build vendor insert rows
    const defaultBudget = bounty.budget || 500;
    type VendorRow = {
      bounty_id: string;
      name: string;
      credentials: string;
      quote_amount: number;
      github_url: string | null;
      summary: string;
      is_verified: boolean;
      is_primary: boolean;
      validation_status: 'validated' | 'rejected' | 'pending';
      artifact_type: string | null;
      citation_id: number | null;
      rejection_reason: string | null;
    };

    const vendorRows: VendorRow[] = [];
    let primaryAssigned = false;

    for (const stub of validStubs) {
      const parsedUrl = parseGitHubUrl(stub.artifact_url!);
      let signalReport: ArtifactSignalReport | null = null;

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
        } else if (parsedUrl.kind === 'commit') {
          const commitMeta = await getCommitMetadata(parsedUrl.owner, parsedUrl.repo, parsedUrl.sha);
          signalReport = assessArtifactSignal(commitMeta.files, {
            additions: commitMeta.stats.additions,
            deletions: commitMeta.stats.deletions,
            message: commitMeta.commit.message.split('\n')[0],
          });
        }
      } catch (metaErr: any) {
        await supabase.from('agent_logs').insert([{
          bounty_id: id,
          phase: 'vetting',
          message: `Signal filter: metadata fetch failed for ${stub.artifact_url} — ${metaErr.message}. Storing as pending.`,
        }]);
      }

      const validationStatus = signalReport
        ? (signalReport.pass ? 'validated' : 'rejected')
        : 'pending';

      const isPrimary = validationStatus === 'validated' && !primaryAssigned;
      if (isPrimary) primaryAssigned = true;

      await supabase.from('agent_logs').insert([{
        bounty_id: id,
        phase: 'vetting',
        message: signalReport
          ? `${stub.developer_handle} (${stub.artifact_url}): ${validationStatus}. ${signalReport.pass ? `Signals: [${signalReport.signals.join(', ') || 'none'}]` : `Rejected: ${signalReport.reason}`}`
          : `${stub.developer_handle} (${stub.artifact_url}): pending (metadata unavailable).`,
        metadata: { stub, signalReport },
      }]);

      vendorRows.push({
        bounty_id: id,
        name: stub.developer_handle || 'Unknown Developer',
        credentials: stub.artifact_type === 'commit' ? 'Commit Contributor' : 'PR Contributor',
        quote_amount: defaultBudget,
        github_url: stub.artifact_url,
        summary: stub.why_it_might_matter,
        is_verified: validationStatus === 'validated',
        is_primary: isPrimary,
        validation_status: validationStatus,
        artifact_type: stub.artifact_type,
        citation_id: stub.citation_id,
        rejection_reason: signalReport && !signalReport.pass ? signalReport.reason : null,
      });
    }

    // If no stub passed validation, promote the first pending row as primary fallback
    if (!primaryAssigned && vendorRows.length > 0) {
      vendorRows[0].is_primary = true;
      primaryAssigned = true;
    }

    // 8. Persist all vendor rows in one insert
    await supabase.from('bounties').update({ agent_phase: 'awaiting_quote' }).eq('id', id);

    const { data: insertedVendors, error: vendorError } = await supabase
      .from('vendors')
      .insert(vendorRows)
      .select();

    if (vendorError) {
      console.error('Error storing vendor pool:', vendorError);
    }

    const allVendors = insertedVendors || [];
    const primaryRow = allVendors.find((v) => v.is_primary) ?? allVendors[0] ?? null;
    const alternativeRows = allVendors.filter((v) => !v.is_primary);

    const validatedCount = allVendors.filter((v) => v.validation_status === 'validated').length;
    const rejectedCount = allVendors.filter((v) => v.validation_status === 'rejected').length;

    // 9. Mark as quote_received
    await supabase
      .from('bounties')
      .update({ agent_phase: 'quote_received' })
      .eq('id', id);

    await supabase.from('agent_logs').insert([{
      bounty_id: id,
      phase: 'quote_received',
      message: `Council pool complete. ${validatedCount} validated, ${rejectedCount} rejected. Primary: ${primaryRow?.name ?? 'none'}.`,
      metadata: {
        totalStubs: validStubs.length,
        validatedCount,
        rejectedCount,
        primaryVendorId: primaryRow?.id ?? null,
      },
    }]);

    return NextResponse.json({
      status: 'dispatched',
      bountyId: id,
      vendor: primaryRow
        ? {
            id: primaryRow.id,
            name: primaryRow.name,
            credentials: primaryRow.credentials,
            githubUrl: primaryRow.github_url,
            summary: primaryRow.summary,
            quoteAmount: primaryRow.quote_amount,
            validationStatus: primaryRow.validation_status,
          }
        : null,
      alternatives: alternativeRows.map((row) => ({
        id: row.id,
        name: row.name,
        credentials: row.credentials,
        githubUrl: row.github_url,
        summary: row.summary,
        quoteAmount: row.quote_amount,
        validationStatus: row.validation_status,
        rejectionReason: row.rejection_reason ?? null,
      })),
      alternativeCount: alternativeRows.length,
      candidatePool: {
        total: validStubs.length,
        validated: validatedCount,
        rejected: rejectedCount,
      },
      rawOutput: pool.rawAgentOutput,
    });

  } catch (error: any) {
    console.error('Error dispatching bounty:', error);

    // Try to log the failure
    try {
      const { id } = await params;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('bounties')
        .update({ agent_phase: 'failed' })
        .eq('id', id);
      await supabase.from('agent_logs').insert([{
        bounty_id: id,
        phase: 'failed',
        message: `Agent dispatch failed: ${error.message}`,
      }]);
    } catch {} // Silently fail on error logging

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
