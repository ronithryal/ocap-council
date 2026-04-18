import { PerplexityTaskRequest, Vendor } from '@/types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/v1/agent';

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

## TECHNICAL VETTING
When evaluating the candidate, you must dive deeply into their technical history:
- Do they have public code (GitHub/GitLab) that matches the specific stack requested (e.g., Rust, Solidity, EVM)?
- Have they published articles, case studies, or issues solving technical problems similar to the objective (e.g., TPS benchmarking, Foundry/Hardhat stress testing)?
- The "summary" field in your JSON MUST briefly cite the technical evidence you found (e.g., "Verified via their 'evm-bench' GitHub repo...").

## RETURN FORMAT
Return your findings as a strict JSON object with this exact structure. 
For the linkedinUrl and githubUrl fields, DO NOT attempt to write the actual URL string. Instead, write the numerical citation ID referencing the source (e.g., "[1]"). We will extract the true URL from your web_search tools. Do NOT wrap the JSON in Markdown code blocks.

{
  "selectedVendor": {
    "name": "Full Name or Business Name",
    "credentials": "Brief summary of relevant experience and qualifications",
    "quoteAmount": 0,
    "linkedinUrl": "[1]",
    "githubUrl": "[2]",
    "websiteUrl": "[3]",
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

The "quoteAmount" should be your best estimate based on market rates, the vendor's public pricing (if available), and the budget constraint of $${task.maxBudget}.

## WARNINGS
- Do NOT hallucinate or fabricate vendor names, URLs, or credentials.
- If a LinkedIn/GitHub citation cannot be found, set it to null rather than guessing.
- The quoteAmount must be a realistic number, not exactly the budget ceiling.
- If you cannot find a strong match, return your best candidate with a clear disclaimer in the summary.
- You must ONLY return raw JSON. Do not include any other text. Do not include conversational text or markdown code blocks like \`\`\`json.
- You must ONLY return the JSON. Do not include any other text outside the JSON block.

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
function parseVendorFromResponse(
  content: string, 
  bountyId: string, 
  searchResults: any[] = []
): {
  selectedVendor: Partial<Vendor>;
  alternativeVendors: Partial<Vendor>[];
  rawAgentOutput: string;
} {
  try {
    // 1. Strip reasoning blocks if they accidentally seep in
    const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // 2. Try to extract JSON from a markdown code block (e.g., ```json ... ```)
    const jsonMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
    let jsonString = '';

    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1].trim();
    } else {
      // 3. Fallback: try to find the outermost JSON object brace structure
      const braceMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonString = braceMatch[0];
      } else {
        jsonString = cleanContent; // Desperation attempt
      }
    }

    const parsed = JSON.parse(jsonString);
    
    // Helper to resolve citation IDs to actual URLs from the Agent API search_results
    const resolveCitation = (val: string | null) => {
      if (!val) return null;
      const match = val.match(/\[(\d+)\]/);
      if (match && match[1]) {
        const id = parseInt(match[1], 10);
        const source = searchResults.find(s => s.id === id);
        if (source) return source.url;
      }
      // If it's a raw URL (hallucinated or real), keep it. If it's just "[1]" but failed lookup, null it.
      return val.includes('http') ? val : null;
    };
    
    return {
      selectedVendor: {
        bountyId,
        name: parsed.selectedVendor?.name || 'Unknown Vendor',
        credentials: parsed.selectedVendor?.credentials || '',
        quoteAmount: parsed.selectedVendor?.quoteAmount || 0,
        linkedinUrl: resolveCitation(parsed.selectedVendor?.linkedinUrl),
        githubUrl: resolveCitation(parsed.selectedVendor?.githubUrl),
        websiteUrl: resolveCitation(parsed.selectedVendor?.websiteUrl),
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
      rawAgentOutput: cleanContent,
    };
  } catch (error) {
    console.error("Failed to parse Perplexity JSON. Raw output:", content);
    
    return {
      selectedVendor: {
        bountyId,
        name: 'Agent Research Output (Unstructured)',
        credentials: 'See raw output for details',
        quoteAmount: 500,
        summary: content.substring(0, 500) + '...',
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
      preset: 'pro-search',
      input: prompt,
      instructions: "You are the autonomous OCAP Council Procurement Agent. Follow the GOAL, TECHNICAL VETTING, RETURN FORMAT, and WARNINGS exactly. Output valid, parseable JSON and nothing else.",
      tools: [{ type: "web_search" }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Perplexity Agent API error:', response.status, errorBody);
    throw new Error(`Perplexity Agent API returned ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  
  // Extract generated message and raw search references from the v1/agent output array
  const messageObj = data.output?.find((o: any) => o.type === 'message');
  const searchObj = data.output?.find((o: any) => o.type === 'search_results');
  
  const content = messageObj?.content?.[0]?.text;
  const searchResults = searchObj?.results || [];

  if (!content) {
    console.error('Unexpected Agent API payload structure:', data);
    throw new Error('Empty or misconfigured response from Perplexity Agent API');
  }

  return parseVendorFromResponse(content, task.bountyId, searchResults);
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
