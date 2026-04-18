import { NextResponse } from 'next/server';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/v1/agent';

/**
 * POST /api/bounty/analyze
 * 
 * Takes a raw user prompt and evaluates it against the Brockman Formula.
 * Returns a conversational question to help "hydrate" the prompt with more context.
 */
export async function POST(request: Request) {
  try {
    const { prompt, history = [] } = await request.json();
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'PERPLEXITY_API_KEY not configured' }, { status: 500 });
    }

    // This agent acts as the "Prompt Architect"
    // Its goal is to audit the prompt and ask ONE clarifying question.
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preset: 'pro-search',
        input: `Current Prompt: "${prompt}"\n\nHistory: ${JSON.stringify(history)}`,
        instructions: `
You are the OCAP Council Prompt Architect. Your role is to help users refine their procurement requests using the Brockman Formula (Goal, Format, Warnings, Context).

Rules:
1. Evaluate if the prompt is "Great" (highly specific, clear goal, clear format).
2. If it's too thin (e.g. "I need a dev"), do NOT dispatch. Instead, ask ONE friendly, conversational question to get more context (e.g., "That sounds like a great start! To find the absolute best match, could you tell me more about the technical stack or the specific problem they should solve?").
3. If the prompt is already excellent and follows the Brockman Formula, respond with the exact string: "READY_TO_DISPATCH".
4. Keep your tone professional, encouraging, and brief. Explain that more context helps the Council find better vendors at better rates.
5. Do NOT return JSON. Return plain text.
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Analyzer API error:', response.status, errorBody);
      throw new Error(`Analyzer API returned ${response.status}`);
    }

    const data = await response.json();
    const messageObj = data.output?.find((o: any) => o.type === 'message');
    const content = messageObj?.content?.[0]?.text;

    if (!content) {
      throw new Error('Empty response from Analyzer API');
    }

    return NextResponse.json({
      reply: content,
      isReady: content.trim() === 'READY_TO_DISPATCH',
    });

  } catch (error: any) {
    console.error('Error analyzing prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
