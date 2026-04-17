import { PerplexityTaskRequest, Vendor } from '@/types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Hydrate a raw user prompt into a structured Brockman Formula prompt.
 * 
 * The Brockman Formula (per Greg Brockman / OpenAI) structures prompts into:
 *   1. Goal — what the model must achieve
 *   2. Return Format — exact schema of the output
 *   3. Warnings — quality guardrails
 *   4. Context Dump — grounding metadata
 */
function hydrateBrockmanPrompt(task: PerplexityTaskRequest): string {
  return `
## GOAL
You are the OCAP Council Procurement Agent. Your mission is to find, vet, and recommend the single best vendor/freelancer for the following B2B procurement request:

"${task.objective}"

Maximum budget: $${task.maxBudget} USD.
${task.constraints.length > 0 ? `Hard constraints: ${task.constraints.join('; ')}` : ''}

You MUST search the live internet to find real candidates. Check LinkedIn profiles, personal websites, GitHub repositories, portfolio sites, and review platforms. Do NOT fabricate vendors.

## RETURN FORMAT
Return your findings as a JSON object with this exact structure:
\`\`\`json
{
  "selectedVendor": {
    "name": "Full Name or Business Name",
    "credentials": "Brief summary of relevant experience and qualifications",
    "quoteAmount": 0,
    "linkedinUrl": "https://linkedin.com/in/...",
    "githubUrl": "https://github.com/...",
    "websiteUrl": "https://...",
    "summary": "2-3 sentence explanation of why this vendor is recommended"
  },
  "alternativeVendors": [
    {
      "name": "...",
      "credentials": "...",
      "quoteAmount": 0,
      "summary": "..."
    }
  ],
  "searchSummary": "Brief description of your search methodology and confidence level"
}
\`\`\`

The "quoteAmount" should be your best estimate based on market rates, the vendor's public pricing (if available), and the budget constraint of $${task.maxBudget}.

## WARNINGS
- Do NOT hallucinate or fabricate vendor names, URLs, or credentials.
- If a LinkedIn/GitHub URL cannot be verified, set it to null rather than guessing.
- The quoteAmount must be a realistic number, not exactly the budget ceiling.
- If you cannot find a strong match, return your best candidate with a clear disclaimer in the summary.
- All URLs must be real, verifiable links that you found during your search.

## CONTEXT
This is an on-chain agentic procurement system. The vendor recommendation will be presented to a business user who will then lock USDC into an escrow smart contract on the Base network. Your recommendation directly triggers a financial commitment, so accuracy is paramount.

Bounty ID for internal tracking: ${task.bountyId}
---
`.trim();
}

/**
 * Parse the Perplexity response to extract structured vendor data.
 * The model returns markdown with a JSON code block embedded.
 */
function parseVendorFromResponse(content: string, bountyId: string): {
  selectedVendor: Partial<Vendor>;
  alternativeVendors: Partial<Vendor>[];
  rawAgentOutput: string;
} {
  try {
    // Try to extract JSON from a code block
    const jsonMatch = content.match(/```json?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        selectedVendor: {
          bountyId,
          name: parsed.selectedVendor?.name || 'Unknown Vendor',
          credentials: parsed.selectedVendor?.credentials || '',
          quoteAmount: parsed.selectedVendor?.quoteAmount || 0,
          linkedinUrl: parsed.selectedVendor?.linkedinUrl || undefined,
          githubUrl: parsed.selectedVendor?.githubUrl || undefined,
          websiteUrl: parsed.selectedVendor?.websiteUrl || undefined,
          summary: parsed.selectedVendor?.summary || '',
          isVerified: true,
        },
        alternativeVendors: (parsed.alternativeVendors || []).map((v: any) => ({
          bountyId,
          name: v.name,
          credentials: v.credentials,
          quoteAmount: v.quoteAmount,
          summary: v.summary,
          isVerified: false,
        })),
        rawAgentOutput: content,
      };
    }

    // Fallback: try parsing the entire content as JSON
    const parsed = JSON.parse(content);
    return {
      selectedVendor: { bountyId, ...parsed.selectedVendor, isVerified: true },
      alternativeVendors: parsed.alternativeVendors || [],
      rawAgentOutput: content,
    };
  } catch {
    // If parsing fails entirely, return a structured fallback with the raw output
    return {
      selectedVendor: {
        bountyId,
        name: 'Agent Research Complete',
        credentials: 'See raw output for details',
        quoteAmount: 0,
        summary: content.substring(0, 500),
        isVerified: false,
      },
      alternativeVendors: [],
      rawAgentOutput: content,
    };
  }
}

/**
 * Dispatch a live Perplexity Sonar Agent to search, vet, and recommend vendors.
 * Uses the sonar-deep-research model for autonomous multi-step web research.
 */
export async function dispatchPerplexityAgent(task: PerplexityTaskRequest): Promise<{
  selectedVendor: Partial<Vendor>;
  alternativeVendors: Partial<Vendor>[];
  rawAgentOutput: string;
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const prompt = hydrateBrockmanPrompt(task);

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-deep-research',
      messages: [
        {
          role: 'system',
          content: 'You are a procurement research agent. You search the internet to find, evaluate, and recommend real vendors and freelancers for B2B bounties. Always return structured JSON with your findings. You are thorough, accurate, and cite real sources.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      return_citations: true,
      search_recency_filter: 'month',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Perplexity API error:', response.status, errorBody);
    throw new Error(`Perplexity API returned ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Perplexity API');
  }

  return parseVendorFromResponse(content, task.bountyId);
}

/**
 * Build a PerplexityTaskRequest from raw bounty data.
 * This is the bridge between the user's simple input and the structured agent task.
 */
export function buildTaskFromBounty(bounty: {
  id: string;
  description: string;
  budget: number;
  title?: string;
  category?: string;
}): PerplexityTaskRequest {
  return {
    bountyId: bounty.id,
    objective: bounty.description,
    constraints: [
      bounty.category ? `Category: ${bounty.category}` : '',
      bounty.title ? `Title: ${bounty.title}` : '',
      `Budget ceiling: $${bounty.budget} USD`,
    ].filter(Boolean),
    maxBudget: bounty.budget,
    callbackUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/api/webhook/perplexity`,
  };
}
