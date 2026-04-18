/**
 * OCAP V2 Forensic Scorer
 *
 * Takes a cleaned GitHub diff + developer handle and runs it through
 * Claude 3.5 Sonnet using the "Grit vs Slop" rubric. Returns a structured
 * ForensicScore that a CTO can bet $2k USDC on.
 *
 * This is the opposite of traditional recruiting scoring — we are specifically
 * hunting for signs of AI-slop (generic boilerplate, hallucinated shortcuts,
 * unhandled edge cases) and awarding points for idiosyncratic human logic
 * (explicit state transitions, network timeout handling, real mutex use, etc.).
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ForensicScore } from '@/types';

// 2026 model IDs. Allow override via env for when we rotate.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

interface ScoreInput {
  developerHandle: string;
  smokingGunUrl: string;
  cleanDiff: string;
  bountyObjective?: string;
  keptFiles?: string[];
  droppedFiles?: string[];
}

/**
 * The "Grit vs Slop" rubric. Hand-tuned, intentionally cynical.
 * This IS the moat — every dimension is designed to specifically
 * detect patterns AI-generated code tends to botch.
 */
const RUBRIC = `
# OCAP FORENSIC SCORING RUBRIC

You are evaluating whether a CTO should spend $2,000 USDC on a 2-week trial
contract with this engineer. Your job is to be BRUTALLY honest. Most diffs
are slop. Finding genuine grit is rare.

## Scoring Dimensions (each 0-10, integer)

### 1. edgeCaseDensity (0-10)
- 0-3: Happy path only. No null checks. No timeouts. No retry logic. No
       input validation. This is AI-slop or junior-level code.
- 4-6: Handles obvious errors but misses subtle cases (e.g., partial failures,
       race conditions under load, malformed-but-valid-looking input).
- 7-10: Handles non-obvious failure modes: network partitions, TOCTOU,
        integer overflow, unicode edge cases, cancellation, resource exhaustion.
        You can tell the author has been burned before.

### 2. architecturalIntent (0-10)
- 0-3: Copy-pasted patterns, implicit state, magic strings, god objects.
       Fixes a symptom, not a root cause.
- 4-6: Decent structure, clear separation but nothing remarkable.
- 7-10: Explicit state machines, typed interfaces, invariants enforced at
        compile time, proper error taxonomy, logic decoupled from I/O.
        Fixes root cause with surgical precision.

### 3. codeFingerprint (0-10)
- 0-3: Screams AI-generated. Generic variable names (result, data, item, tmp).
       Verbose JSDoc on self-explanatory functions. Over-commenting obvious lines.
       Wrapped try/catch on things that can't throw. Stack-overflow-answer vibes.
- 4-6: Mixed signals. Some idiosyncratic touches, some boilerplate.
- 7-10: Clearly human, clearly this specific human. Domain-aware naming,
        terse where appropriate, comments explain WHY not WHAT, unusual
        but defensible choices. Reads like the author has strong opinions.

### 4. testingRigor (0-10)
- 0-3: No tests. Or "tests" that just call the function and assert truthy.
       Coverage theater.
- 4-6: Unit tests for the happy path. Some mocking. Reasonable but shallow.
- 7-10: Property-based tests, fuzz inputs, deterministic concurrency tests,
        tests that pin down specific failure modes, regression tests tied
        to issue numbers. The tests tell a story.

## gritScore (0-10)
Weighted average but NOT mechanical. Apply judgment. A 9 on edgeCaseDensity
with a 3 on codeFingerprint probably means AI-assisted code wrapping real
logic — score accordingly. A 10 requires all four dimensions to be strong.

## archetype
- **Concurrency Master**: Fixed race conditions, mutexes, atomics, memory
  ordering, lock-free structures, async cancellation correctness.
- **State Architect**: Decomposed tangled state into explicit machines,
  introduced typed transitions, enforced invariants.
- **Chaos Engineer**: Hardened against real-world failure — timeouts,
  retries with jitter, fault injection, graceful degradation.
- **Generalist**: Broad competence, nothing specialized enough to label.
- **Uncategorized**: Not enough signal in the diff to classify.

## recommendation
- **HIRE_FOR_TRIAL**: gritScore >= 8, no critical red flags. Green-light the $2k.
- **NEEDS_HUMAN_REVIEW**: gritScore 5-7, or strong dimensions + real concerns.
  Escalate to a human engineer before committing funds.
- **DO_NOT_HIRE**: gritScore <= 4, or clear AI-slop patterns, or critical
  red flags (leaks, unsafe code, obvious bugs shipped).

## gritMarkers
List 2-5 specific, quotable patterns from the diff that PROVE grit. Reference
file paths and, where useful, quote the exact line. Be specific — "good tests"
is useless, "uses quickcheck with shrinking on the parser's unicode path" is gold.

## redFlags
List 0-5 specific concerns. Same specificity rule. If truly nothing is wrong,
return []. Do not pad.

## justification
ONE paragraph. Address the CTO directly. No hedging. State the call and why.
`;

/**
 * Build the user-message payload Claude will score.
 */
function buildScorePrompt(input: ScoreInput): string {
  return `
# Candidate
- **Developer:** ${input.developerHandle}
- **Smoking Gun URL:** ${input.smokingGunUrl}
${input.bountyObjective ? `- **Bounty Objective:** ${input.bountyObjective}` : ''}

# Diff Coverage
- **Files evaluated (${input.keptFiles?.length ?? 0}):** ${input.keptFiles?.slice(0, 40).join(', ') ?? 'n/a'}
${input.droppedFiles?.length ? `- **Boilerplate stripped (${input.droppedFiles.length}):** ${input.droppedFiles.slice(0, 20).join(', ')}${input.droppedFiles.length > 20 ? ', ...' : ''}` : ''}

# Raw Diff (boilerplate removed)
\`\`\`diff
${input.cleanDiff}
\`\`\`

# Instructions
Score this developer using the rubric above. Return ONLY a single JSON
object matching the schema. No prose, no markdown fences, no preamble.
`.trim();
}

/**
 * The JSON schema Claude MUST conform to. We'll use a tool-call with
 * input_schema to force structured output — this is dramatically more
 * reliable than hoping the model outputs clean JSON in free text.
 */
const SCORE_TOOL_SCHEMA = {
  name: 'submit_forensic_score',
  description:
    'Submit the final forensic evaluation of the candidate. Must strictly follow the rubric.',
  input_schema: {
    type: 'object',
    required: [
      'gritScore',
      'archetype',
      'dimensions',
      'gritMarkers',
      'redFlags',
      'justification',
      'recommendation',
    ],
    properties: {
      gritScore: {
        type: 'integer',
        minimum: 0,
        maximum: 10,
        description: 'Overall engineering grit score, 0-10.',
      },
      archetype: {
        type: 'string',
        enum: [
          'Concurrency Master',
          'State Architect',
          'Chaos Engineer',
          'Generalist',
          'Uncategorized',
        ],
      },
      dimensions: {
        type: 'object',
        required: [
          'edgeCaseDensity',
          'architecturalIntent',
          'codeFingerprint',
          'testingRigor',
        ],
        properties: {
          edgeCaseDensity: { type: 'integer', minimum: 0, maximum: 10 },
          architecturalIntent: { type: 'integer', minimum: 0, maximum: 10 },
          codeFingerprint: { type: 'integer', minimum: 0, maximum: 10 },
          testingRigor: { type: 'integer', minimum: 0, maximum: 10 },
        },
      },
      gritMarkers: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Specific patterns from the diff that prove grit. 2-5 items, each referencing a file/line/pattern.',
      },
      redFlags: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Specific concerns observed in the diff. 0-5 items. Empty array if none.',
      },
      justification: {
        type: 'string',
        description:
          'One CTO-grade paragraph stating the call and reasoning. No hedging.',
      },
      recommendation: {
        type: 'string',
        enum: ['HIRE_FOR_TRIAL', 'NEEDS_HUMAN_REVIEW', 'DO_NOT_HIRE'],
      },
    },
  },
} as const;

/**
 * Run the Forensic Scorer on a cleaned diff.
 *
 * Uses Anthropic tool-use to force a structured JSON output. Throws on
 * API errors, missing key, or malformed responses — the caller should
 * handle failure and log it to `agent_logs`.
 */
export async function scoreForensicDiff(input: ScoreInput): Promise<ForensicScore> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith('PASTE_')) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: RUBRIC,
    tools: [SCORE_TOOL_SCHEMA as any],
    tool_choice: { type: 'tool', name: 'submit_forensic_score' },
    messages: [
      {
        role: 'user',
        content: buildScorePrompt(input),
      },
    ],
  });

  // Find the tool_use block
  const toolUse = response.content.find((b: any) => b.type === 'tool_use') as
    | { type: 'tool_use'; name: string; input: ForensicScore }
    | undefined;

  if (!toolUse) {
    console.error('Claude did not return a tool_use block:', JSON.stringify(response.content));
    throw new Error('Forensic Scorer returned no structured output');
  }

  return toolUse.input;
}
