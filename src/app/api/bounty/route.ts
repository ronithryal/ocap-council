import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const data = await request.json();

    const { title, description, budget, category, userId } = data;

    if (!title || !budget || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: bounty, error } = await supabase
      .from('bounties')
      .insert([
        {
          title,
          description,
          budget,
          category,
          user_id: userId,
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
