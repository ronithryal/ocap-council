import { NextResponse } from 'next/server';

/**
 * POST /api/bounty/analyze
 * Brockman hydration removed. Always returns READY_TO_DISPATCH immediately.
 */
export async function POST() {
  return NextResponse.json({ reply: 'READY_TO_DISPATCH', isReady: true });
}
