import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PerplexityWebhookResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const payload: PerplexityWebhookResponse = await request.json();

    const { bountyId, status, findings, error } = payload;

    if (!bountyId) {
      return NextResponse.json({ error: 'Missing bountyId' }, { status: 400 });
    }

    if (status === 'failure') {
      await supabase
        .from('bounties')
        .update({ agent_phase: 'failed' })
        .eq('id', bountyId);
      
      await supabase.from('agent_logs').insert([
        {
          bounty_id: bountyId,
          phase: 'failed',
          message: `Agent failed: ${error || 'Unknown error during procurement.'}`,
        },
      ]);
      
      return NextResponse.json({ status: 'logged_error' });
    }

    // 1. Store the selected vendor and alternative findings
    const { selectedVendor, alternativeVendors } = findings;

    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert([
        {
          bounty_id: bountyId,
          name: selectedVendor.name,
          credentials: selectedVendor.credentials,
          quote_amount: selectedVendor.quoteAmount,
          linkedin_url: selectedVendor.linkedinUrl,
          github_url: selectedVendor.githubUrl,
          summary: selectedVendor.summary,
          is_verified: true,
        },
      ])
      .select()
      .single();

    if (vendorError) throw vendorError;

    // 2. Update bounty phase to 'quote_received'
    await supabase
      .from('bounties')
      .update({ agent_phase: 'quote_received', status: 'active' })
      .eq('id', bountyId);

    // 3. Final log entry
    await supabase.from('agent_logs').insert([
      {
        bounty_id: bountyId,
        phase: 'quote_received',
        message: `Agent complete: Found ${selectedVendor.name} matching all compliance requirements. Quote ready for settlement.`,
        metadata: { findings },
      },
    ]);

    return NextResponse.json({ status: 'webhook_processed', vendorId: vendor.id });
  } catch (err: any) {
    console.error('Error in Perplexity webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
