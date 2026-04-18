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
You are the OCAP Council Forensic Hunter. Your mission is to find the top 1% of engineers for the following highly technical requirement:

"${task.objective}"

We are NOT looking for generic developers. We are hunting for "Grit Fingerprints" on GitHub. You must utilize agentic search strategies to find behavioral markers (e.g., fixing mature race conditions, complex memory optimizations, or 'spaghetti' logic refactoring).

## TECHNICAL VETTING (THE ARCHETYPES)
Your search must categorize candidates into one of these archetypes based on their raw code history:
1. **Concurrency Masters:** (Search for PRs fixing memory leaks, race conditions, using mutexes in Rust, C++, Go).
2. **State Architects:** (Search for PRs decoupling monolithic state into explicit, verifiable state machines).
3. **Chaos Engineers:** (Search for PRs implementing deep edge-case handling like exponential backoffs, dead-lock prevention, or handling malformed data gracefully).

## RETURN FORMAT
Return your findings as a strict JSON object with this exact structure. 
For the 'smoking_gun_url', DO NOT attempt to write the actual URL string. Instead, write the numerical citation ID referencing the search result (e.g., "[1]"). We will extract the true URL. Do NOT wrap the JSON in Markdown.

{
  "selectedCandidate": {
    "developer_handle": "GitHub Username",
    "archetype_label": "Concurrency Master | State Architect | Chaos Engineer",
    "smoking_gun_url": "[1]",
    "summary": "Deep forensic technical justification summarizing why this specific PR proves their grit and avoids AI-slop."
  },
  "alternativeCandidates": [
    {
      "developer_handle": "...",
      "archetype_label": "...",
      "smoking_gun_url": "[2]",
      "summary": "..."
    }
  ],
  "searchSummary": "Brief description of the behavioral keywords and filters used during your forensic search."
}

## WARNINGS
- Do NOT hallucinate GitHub URLs or developer names.
- The 'smoking_gun_url' MUST be a link to a specific GitHub Pull Request or Commit, NOT a user profile.
- You must ONLY return raw JSON. Do not include conversational text or markdown blocks like \`\`\`json.
- Do NOT base recommendations on social followers or stars. Rely solely on the technical depth of their commits.

## CONTEXT
This output will be fed directly into OCAP's V2 Forensic Labeler which pulls the raw .diff file of the smoking_gun_url for semantic evaluation. The atomic trial unit is a $2k USDC contract.
Bounty ID: ${task.bountyId}
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
        name: parsed.selectedCandidate?.developer_handle || 'Unknown Developer',
        credentials: parsed.selectedCandidate?.archetype_label || 'Uncategorized Grit',
        quoteAmount: 2000, // Fixed $2k Trial Contract (V2 Atomic Unit)
        githubUrl: resolveCitation(parsed.selectedCandidate?.smoking_gun_url),
        summary: parsed.selectedCandidate?.summary || '',
        isVerified: true,
      },
      alternativeVendors: (parsed.alternativeCandidates || []).map((v: any) => ({
        bountyId,
        name: v.developer_handle,
        credentials: v.archetype_label,
        quoteAmount: 2000, // Fixed $2k Trial Contract
        githubUrl: resolveCitation(v.smoking_gun_url),
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
