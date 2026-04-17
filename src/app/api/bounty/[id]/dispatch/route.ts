import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Mocking the Perplexity Dispatch for Phase 5.
 * In a real scenario, this would POST to the Perplexity Agent API.
 * Here, we trigger an async mock process to simulate the agentic loop.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Update status to 'dispatching'
    await supabase
      .from('bounties')
      .update({ agent_phase: 'dispatching' })
      .eq('id', id);

    // 2. Add an initial log
    await supabase.from('agent_logs').insert([
      {
        bounty_id: id,
        phase: 'dispatching',
        message: 'Formatting requirements and hydrating with company compliance facts (Brockman Formula)...',
      },
    ]);

    // 3. Trigger mock background process (non-blocking)
    // In production, this would be a real API call to Perplexity with our webhook as the callback.
    // We simulate this logic in Phase 7.
    
    return NextResponse.json({ status: 'dispatched', bountyId: id });
  } catch (error: any) {
    console.error('Error dispatching bounty:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
