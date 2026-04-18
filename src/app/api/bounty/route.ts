import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // Use the Service Role Key to bypass RLS for demo submissions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data = await request.json();
    const { title, description, budget, category, userId } = data;

    if (!title || !budget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure we have a valid UUID. If 'anon' or undefined, generate a temporary one.
    const validUserId = (userId && userId !== 'anon' && userId.length === 42) // Assuming 42 is for ETH address length but Supabase expects UUID
      ? crypto.randomUUID() // ETH addresses (0x...) aren't valid UUIDs in Postgres anyway. Let's force a UUID.
      : crypto.randomUUID();

    const { data: bounty, error } = await supabase
      .from('bounties')
      .insert([
        {
          title,
          description,
          budget,
          category,
          user_id: validUserId,
          status: 'pending',
          agent_phase: 'idle',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(bounty);
  } catch (error: any) {
    console.error('Error creating bounty:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
