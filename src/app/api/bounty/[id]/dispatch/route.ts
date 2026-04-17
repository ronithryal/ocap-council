import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dispatchPerplexityAgent, buildTaskFromBounty } from '@/lib/perplexity';

/**
 * POST /api/bounty/[id]/dispatch
 * 
 * Dispatches the Perplexity Computer Agent to autonomously search, vet,
 * and recommend vendors for the given bounty. Updates the database with
 * real-time phase transitions and logs throughout the process.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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
      message: 'Analyzing search results. Cross-referencing credentials against requirements...',
    }]);

    // 6. Execute the live Perplexity call
    const findings = await dispatchPerplexityAgent(task);

    // 7. Log the awaiting_quote phase
    await supabase
      .from('bounties')
      .update({ agent_phase: 'awaiting_quote' })
      .eq('id', id);

    await supabase.from('agent_logs').insert([{
      bounty_id: id,
      phase: 'awaiting_quote',
      message: `Vendor identified: ${findings.selectedVendor.name}. Calculating market-rate quote...`,
    }]);

    // 8. Store the vendor in the database
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert([{
        bounty_id: id,
        name: findings.selectedVendor.name,
        credentials: findings.selectedVendor.credentials,
        quote_amount: findings.selectedVendor.quoteAmount,
        linkedin_url: findings.selectedVendor.linkedinUrl,
        github_url: findings.selectedVendor.githubUrl,
        summary: findings.selectedVendor.summary,
        is_verified: findings.selectedVendor.isVerified ?? true,
      }])
      .select()
      .single();

    if (vendorError) {
      console.error('Error storing vendor:', vendorError);
    }

    // 9. Mark as quote_received
    await supabase
      .from('bounties')
      .update({ agent_phase: 'quote_received' })
      .eq('id', id);

    await supabase.from('agent_logs').insert([{
      bounty_id: id,
      phase: 'quote_received',
      message: `Council Recommendation ready. ${findings.selectedVendor.name} — $${findings.selectedVendor.quoteAmount}. Awaiting settlement.`,
      metadata: { 
        vendor: findings.selectedVendor,
        alternatives: findings.alternativeVendors.length,
      },
    }]);

    return NextResponse.json({
      status: 'dispatched',
      bountyId: id,
      vendor: findings.selectedVendor,
      alternativeCount: findings.alternativeVendors.length,
      rawOutput: findings.rawAgentOutput,
    });

  } catch (error: any) {
    console.error('Error dispatching bounty:', error);

    // Try to log the failure
    try {
      const { id } = await params;
      const supabase = await createClient();
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
