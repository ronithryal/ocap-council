import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch bounty and its latest status/logs
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select(`
        *,
        vendors (*),
        agent_logs (*)
      `)
      .eq('id', id)
      .single();

    if (bountyError) throw bountyError;

    return NextResponse.json(bounty);
  } catch (error: any) {
    console.error('Error fetching bounty status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
