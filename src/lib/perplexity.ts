import { PerplexityTaskRequest, Vendor } from '@/types';
import { parseGitHubUrl } from '@/lib/github';

// ---------------------------------------------------------------------------
// Phase A: candidate pool types
// ---------------------------------------------------------------------------

/** Artifact types Perplexity is allowed to surface. Repo roots are not valid. */
export type ArtifactType = 'pull_request' | 'commit';

export interface CandidateEvidenceStub {
  developer_handle: string;
  /** "owner/repo" extracted from the artifact URL */
  repo: string;
  artifact_type: ArtifactType;
  /** Resolved PR or commit URL. null means the citation could not be validated. */
  artifact_url: string | null;
  why_it_might_matter: string;
  citation_id: number | null;
}

export interface CandidatePool {
  stubs: CandidateEvidenceStub[];
  /** Number of raw candidates in the parsed JSON before citation validation. */
  rawCandidateCount: number;
  /**
   * 'ok'          — JSON parsed and ≥1 valid PR/commit URL resolved.
   * 'zero_valid'  — JSON parsed but every citation resolved to null (all repo-root, profile, or missing).
   * 'parse_error' — JSON could not be parsed at all.
   */
  parseStatus: 'ok' | 'zero_valid' | 'parse_error';
  searchSummary: string;
  rawAgentOutput: string;
}

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
You are the OCAP Council Forensic Hunter. Your mission is to surface a pool of candidate evidence stubs for the following highly technical requirement:

"${task.objective}"

We are NOT looking for generic developers. We are hunting for "Grit Fingerprints" on GitHub — behavioral markers in real commits and pull requests (e.g., fixing mature race conditions, complex memory optimizations, non-trivial state refactors).

Your job in this stage is DISCOVERY only. Do not rank or select a winner. Return a pool of 3–8 candidates with evidence stubs. Downstream systems will validate and score them.

## DISCOVERY GUIDANCE
Prioritize artifacts that exhibit these complexity markers:
1. **Architectural Scope:** Changes across 3+ files in different directories/subsystems
2. **Logic Density:** Non-trivial production logic (not auto-generated, not doc/config/test)
3. **State/Concurrency Impact:** Shared state, mutexes, channels, state machines
4. **Edge Case Handling:** Malformed input, boundary conditions, error recovery
5. **Technical Depth:** Language-specific primitives (Go interfaces, Rust lifetimes, C++ templates, Solidity assembly)

Avoid surfacing: typo fixes, README/doc-only changes, formatting commits, dependency bumps, bot-authored PRs, single-line changes. We would rather have a smaller pool of genuine candidates than a large pool of noise.

## RETURN FORMAT
Return a strict JSON object with this exact structure. Do NOT wrap in Markdown. Do NOT write raw URLs — use citation IDs only (e.g., "[1]").

{
  "candidates": [
    {
      "developer_handle": "GitHub username",
      "repo": "owner/repo",
      "artifact_type": "pull_request",
      "artifact_url": "[1]",
      "why_it_might_matter": "One sentence: what technical problem this artifact addresses and why it suggests depth."
    }
  ],
  "searchSummary": "Brief description of the behavioral keywords and search strategies used."
}

Rules for artifact_type: use "pull_request" for PR links, "commit" for commit links. Never use a repo root URL or a user profile URL as artifact_url — those are not valid evidence artifacts.

## WARNINGS
- Do NOT hallucinate GitHub URLs or developer names.
- artifact_url MUST be a citation ID like "[1]" pointing to a specific PR or commit, not a profile or repo root.
- Return raw JSON only. No conversational text.
- Do NOT rank or filter to a single winner — return the full discovery pool.

## CONTEXT
This output feeds OCAP's validation and forensic scoring pipeline. Only artifacts that pass GitHub metadata checks and deterministic signal filters will reach the scorer.
Bounty ID: ${task.bountyId}
---
`.trim();
}

// ---------------------------------------------------------------------------
// Phase A: candidate pool parser
// ---------------------------------------------------------------------------

/**
 * Resolve a Perplexity citation reference (e.g., "[1]") to a validated GitHub URL.
 *
 * Strict: only resolves to PR or commit URLs. Repo-root, profile, and any
 * non-GitHub URLs are rejected and return null. Raw URL fallback is intentionally
 * removed — hallucinated URLs pass no structural validation.
 */
function resolveCitationStrict(
  val: string | null,
  searchResults: any[],
): { url: string | null; citationId: number | null } {
  if (!val) return { url: null, citationId: null };

  const match = val.match(/\[(\d+)\]/);
  if (!match) return { url: null, citationId: null };

  const id = parseInt(match[1], 10);
  const source = searchResults.find((s) => s.id === id);
  if (!source?.url) return { url: null, citationId: id };

  const parsed = parseGitHubUrl(source.url);
  if (parsed.kind !== 'pull' && parsed.kind !== 'commit') {
    return { url: null, citationId: id };
  }
  return { url: source.url, citationId: id };
}

/**
 * Parse a Perplexity agent response into a structured CandidatePool.
 * Distinguishes three failure modes via parseStatus:
 *   'ok'          — parsed and ≥1 valid PR/commit URL resolved
 *   'zero_valid'  — parsed successfully but all citations resolved to null
 *   'parse_error' — JSON could not be extracted at all
 */
export function parseCandidatePool(
  content: string,
  _bountyId: string,
  searchResults: any[] = [],
): CandidatePool {
  const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  let jsonString = '';
  const jsonMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (jsonMatch?.[1]) {
    jsonString = jsonMatch[1].trim();
  } else {
    const braceMatch = cleanContent.match(/\{[\s\S]*\}/);
    jsonString = braceMatch ? braceMatch[0] : cleanContent;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return {
      stubs: [],
      rawCandidateCount: 0,
      parseStatus: 'parse_error',
      searchSummary: '',
      rawAgentOutput: cleanContent,
    };
  }

  const rawCandidates: any[] = Array.isArray(parsed.candidates) ? parsed.candidates : [];
  const stubs: CandidateEvidenceStub[] = rawCandidates.map((c) => {
    const { url, citationId } = resolveCitationStrict(c.artifact_url, searchResults);
    const repoFromUrl = (() => {
      if (!url) return c.repo ?? '';
      try {
        const p = parseGitHubUrl(url);
        if (p.kind === 'pull' || p.kind === 'commit') return `${p.owner}/${p.repo}`;
      } catch {}
      return c.repo ?? '';
    })();

    return {
      developer_handle: c.developer_handle ?? '',
      repo: repoFromUrl,
      artifact_type: (c.artifact_type === 'commit' ? 'commit' : 'pull_request') as ArtifactType,
      artifact_url: url,
      why_it_might_matter: c.why_it_might_matter ?? '',
      citation_id: citationId,
    };
  });

  const validCount = stubs.filter((s) => s.artifact_url !== null).length;
  const parseStatus = validCount > 0 ? 'ok' : 'zero_valid';

  return {
    stubs,
    rawCandidateCount: rawCandidates.length,
    parseStatus,
    searchSummary: parsed.searchSummary ?? '',
    rawAgentOutput: cleanContent,
  };
}

// ---------------------------------------------------------------------------
// Legacy vendor-shape parser (private — fallback only)
// ---------------------------------------------------------------------------

/**
 * Parse the Perplexity response to extract structured vendor data.
 * The model returns markdown with a JSON code block embedded.
 */
function parseVendorFromResponse(
  content: string, 
  bountyId: string, 
  searchResults: any[] = [],
  defaultBudget: number = 500
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
        quoteAmount: defaultBudget, // Flexible rate based on task budget
        githubUrl: resolveCitation(parsed.selectedCandidate?.smoking_gun_url),
        summary: parsed.selectedCandidate?.summary || '',
        isVerified: true,
      },
      alternativeVendors: (parsed.alternativeCandidates || []).map((v: any) => ({
        bountyId,
        name: v.developer_handle,
        credentials: v.archetype_label,
        quoteAmount: defaultBudget,
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

// ---------------------------------------------------------------------------
// Shared HTTP transport — keeps fetch logic in one place
// ---------------------------------------------------------------------------

async function callPerplexityApi(
  task: PerplexityTaskRequest,
): Promise<{ content: string; searchResults: any[] }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY is not configured');

  const prompt = hydrateBrockmanPrompt(task);

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      preset: 'pro-search',
      input: prompt,
      instructions:
        'You are the autonomous OCAP Council Discovery Agent. Follow the GOAL, DISCOVERY GUIDANCE, RETURN FORMAT, and WARNINGS exactly. Output valid, parseable JSON and nothing else.',
      tools: [{ type: 'web_search' }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Perplexity Agent API error:', response.status, errorBody);
    throw new Error(`Perplexity Agent API returned ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const messageObj = data.output?.find((o: any) => o.type === 'message');
  const searchObj = data.output?.find((o: any) => o.type === 'search_results');
  const content = messageObj?.content?.[0]?.text;

  if (!content) {
    console.error('Unexpected Agent API payload structure:', data);
    throw new Error('Empty or misconfigured response from Perplexity Agent API');
  }

  return { content, searchResults: searchObj?.results || [] };
}

// ---------------------------------------------------------------------------
// Phase B primary export: returns the full CandidatePool
// ---------------------------------------------------------------------------

/**
 * Dispatch the Perplexity discovery agent and return a structured candidate pool.
 * This is the canonical export for Phase B — dispatch/route.ts uses this directly.
 */
export async function dispatchPerplexityPool(task: PerplexityTaskRequest): Promise<CandidatePool> {
  const { content, searchResults } = await callPerplexityApi(task);
  const pool = parseCandidatePool(content, task.bountyId, searchResults);

  if (pool.parseStatus === 'parse_error') {
    console.error(
      `[Perplexity] parse_error — JSON could not be extracted. Raw output (first 300): ${content.slice(0, 300)}`,
    );
  } else if (pool.parseStatus === 'zero_valid') {
    console.warn(
      `[Perplexity] zero_valid — parsed ${pool.rawCandidateCount} candidate(s) but all citations resolved to null (repo-root or missing). Summary: ${pool.searchSummary}`,
    );
  } else {
    const validCount = pool.stubs.filter((s) => s.artifact_url !== null).length;
    console.info(
      `[Perplexity] ok — ${validCount}/${pool.rawCandidateCount} candidates have valid PR/commit URLs. Summary: ${pool.searchSummary}`,
    );
  }

  return pool;
}

// ---------------------------------------------------------------------------
// Legacy vendor-shape export — kept for backward-compat only
// ---------------------------------------------------------------------------

/**
 * @deprecated Use dispatchPerplexityPool for Phase B and beyond.
 * Retained so any callers outside dispatch/route.ts continue to compile.
 */
export async function dispatchPerplexityAgent(task: PerplexityTaskRequest): Promise<{
  selectedVendor: Partial<Vendor>;
  alternativeVendors: Partial<Vendor>[];
  rawAgentOutput: string;
}> {
  const { content, searchResults } = await callPerplexityApi(task);
  const pool = parseCandidatePool(content, task.bountyId, searchResults);

  if (pool.parseStatus === 'parse_error') {
    console.error(
      `[Perplexity] parse_error (legacy path) — Raw output (first 300): ${content.slice(0, 300)}`,
    );
    return parseVendorFromResponse(content, task.bountyId, searchResults, task.maxBudget || 500);
  }

  const defaultBudget = task.maxBudget || 500;
  const validStubs = pool.stubs.filter((s) => s.artifact_url !== null);
  const [primary, ...rest] = validStubs;

  return {
    selectedVendor: primary
      ? {
          bountyId: task.bountyId,
          name: primary.developer_handle || 'Unknown Developer',
          credentials: primary.artifact_type === 'commit' ? 'Commit Contributor' : 'PR Contributor',
          quoteAmount: defaultBudget,
          githubUrl: primary.artifact_url ?? undefined,
          summary: primary.why_it_might_matter,
          isVerified: true,
        }
      : {
          bountyId: task.bountyId,
          name: 'Agent Research Output (No Valid Artifacts)',
          credentials: 'See raw output for details',
          quoteAmount: defaultBudget,
          summary: pool.searchSummary || content.slice(0, 500),
          isVerified: false,
        },
    alternativeVendors: rest.map((s) => ({
      bountyId: task.bountyId,
      name: s.developer_handle,
      credentials: s.artifact_type === 'commit' ? 'Commit Contributor' : 'PR Contributor',
      quoteAmount: defaultBudget,
      githubUrl: s.artifact_url ?? undefined,
      summary: s.why_it_might_matter,
      isVerified: false,
    })),
    rawAgentOutput: pool.rawAgentOutput,
  };
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