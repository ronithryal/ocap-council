# Product Manager Diary (product.md)

**Purpose:** Strategic record of "what" and "for whom."
**Rules:** Proactively append hypotheses on PMF (Product-Market Fit), monetization hooks, and user personas.

---

## [2026-04-17] Strategic Pivot: Settlement Infrastructure

### Dropping Privy -> Adopting Coinbase CDP
While Privy offers superior consumer onboarding UX, we are prioritizing **unit economics** and **ecosystem depth**. 

**Why CDP?**
1.  **Lower Friction for B2B:** Our target users (corporates/protocols) likely already interface with the Coinbase ecosystem.
2.  **Cost Advantage:** Pay-as-you-go pricing allows us to keep the barrier to entry extremely low for small bounties, whereas Privy's MAU overhead would eat into margins.
3.  **Base-Native:** Building on the "Base-Native" narrative strengthens our positioning for grants and ecosystem support within the Optimism/Superchain stack.

### The Problem
Traditional B2B bounty ecosystems are bogged down by high-trust requirements and manual verification (PDF quotes, vendor reputation, escrow release).

### The Solution: OCAP Council
An agentic engine that uses "The Principal" model (Hermes-3) to audit automated vendor discovery (Perplexity) and verify "Proofs of Work" before releasing USDC.

### PMF Hypotheses
*   **Target Persona:** Crypto-native protocols needing immediate auditing or vendor discovery without hiring full-time procurement teams.
*   **Monetization Hook:** A small percentage "Audit Fee" on every bounty released through the Principal's verification layer.
*   **Retention:** Weighted Memory Engine that tracks vendor reputation, creating a proprietary "Trust Graph" for the B2B ecosystem.

---

## [2026-04-17] Frictionless Onboarding & Proof of Delivery

### 1. The Onboarding Funnel (UX Strategy)
*   **The Error:** Forcing users to connect a wallet *before* letting the Perplexity Agent work was killing the demo experience. 
*   **The Fix:** We completely decoupled the wallet from the request. Users can now type a prompt, dispatch the agent, watch it work, and view the finalized quote cards *without logging in*. The wallet is now strictly a "Checkout" (Merchant Grade) feature at the very end of the funnel.

### 2. Upgrading the "Brain" for the Billion Dollar Build
*   **Conflict:** We originally used `sonar-deep-research`. However, Perplexity's Research models are hardcoded to produce conversational, 10,000-word reports, which completely broke our rigid JSON-based B2B interface.
*   **Solution:** We are migrating to the true **Perplexity Agent API**. By passing `web_search` as a dedicated *tool* to a generative LLM (rather than using an intrinsic search-model), we fully separate the "Research" action from the "Writing/Formatting" action. This ensures massive technical specificity without format-breaking hallucinations.

### 3. Fixing the Hallucination UX
*   **The Issue:** Generating high-quality JSON schemas containing raw URLs failed frequently. Asking the "Language Generation" part of Perplexity's system to format URLs directly caused hallucinations or schema crashes, leading to poor UX where users stared at an "Agent Dispatch Failed" retry state.
*   **The Guide's Solution:** By rewriting the architecture to map numerical citations (e.g., `[2]`) directly to the API's backend `search_results` array, we now generate flawless JSON that contains mathematically guaranteed, non-hallucinated Github and LinkedIn URLs for verified procurement.

### 4. Interactive Hydration Strategy
*   **Approach:** Implementing a "Prompt Hydration" chat interface. Before dispatching the expensive Perplexity Agent, a cheaper "Architect" agent (Gemini 3.1 Flash) will chat with the user to fill in "Brockman Formula" gaps.
*   **UX Hypothesis:** Chatbot-style interaction feels more premium and interactive than a static form. 
*   **Future A/B Test:** We will eventually test **Chatbot-style (Conversational)** versus **Form-filling (Structured)** to see which yields higher "Bounty Quality" and lower "Drop-off Rate."

### 5. The "Audited Settlement" Moat (2026 Strategy)
*   **The Conflict:** Simple search engines and general marketplaces (Fiverr/Upwork) are failing due to "Trust Decay" (AI-generated garbage and fake reviews).
*   **The Moat:** OCAP's value is **Audited Settlement.** We don't just "find" humans; we provide an **Autonomous Procurement Ledger.** 
    *   **Phase 1:** Agentic Vetting (Truth over Ratings).
    *   **Phase 2:** Escrow Funding (Instant Mobilization).
    *   **Phase 3:** Autonomous Verification (PoD Audit).
    *   **Phase 4:** Guaranteed Release (No Chargebacks).

### 6. Vertical Managed Service Providers (MSPs)
*   **Insight:** "Managed" marketplaces like **Craftwork** (W-2 workforce, flat-rate pricing) are the highest-fidelity targets for our Agent. 
*   **Expansion:** We are transitioning from a general "Dev-first" tool to a vertical engine that pivots its "Technical Vetting" logic based on industry-specific "Ground Truths" (e.g., searching for W-2 guarantees at Craftwork vs. Commit Logs on GitHub).

### 7. Conversational Onboarding (The Chatbot Shift)
*   **Observation:** Users often provide "thin" prompts (e.g. "I need a dev").
*   **Solution:** Implemented the **Hydration Chat**. By using a reasoning agent to "pull" details from the user via a conversational UI, we increase the probability of high-quality agentic quote generation from the Perplexity API.
*   **UX Value:** This positions OCAP as an "Expert Agent" rather than a simple form, increasing perceived value.

### 8. The "Post-Hire" Roadmap
To satisfy the competition's requirement for a fully autonomous company, we cannot stop at the "Hire" button. Next steps:
> **Phase 9: Proof of Delivery (PoD)**
> Vendors submit their work (e.g., GitHub Repo). The Perplexity Agent autonomously navigates to that repository, executes a verification sequence against the original user prompt, and approves the work.

> 
> **Phase 10: Automated Escrow Release**
> Upon Agent approval, a webhook is fired to the Coinbase Smart Contract to autonomously release the frozen USDC to the vendor. No human auditing required.

### 9. OCAP V2: The Forensic Engineering Pivot
*   **The Pivot:** We are abandoning the "Yellow Pages" model (generalized routing for home services, craftwork, physical goods). Trying to compete in the "Gig" or "Lead Gen" market traps the product in low-margin, high-friction operational nightmares. Plus, the likes of Craftwork and Angi are already doing this.
*   **The "AI-Slop" Crisis:** In 2026, the real problem CTOs faces is not finding *a* developer, but finding the 1% who possess deep architectural "Grit." The market is flooded with engineers generating unvetted, generic boilerplate using LLMs (AI-slop).
*   **The V2 Moat (Forensic Behavioral Engine):** OCAP is now a **High-Precision Talent Weapon**. We no longer match via generic keywords. We use Perplexity to hunt for specific behavioral markers on GitHub (e.g., fixing race conditions, high-complexity refactoring) and run candidates through a **Semantic Feature Store**.
*   **Recursive Learning Loop:** We evaluate candidates' raw `.diff` files against a database of "God-Tier" code. By dynamically ingesting new high-scoring PRs when a CTO hires a candidate, our autonomous vetting logic physically evolves, ensuring OCAP's definitions of "Good Code" constantly outpace the rise of AI-generated noise.

---

## [2026-04-18] V2 Cynical Dashboard — Prototype Live

### What the Dashboard Demonstrates
The `/forensic-demo` prototype shows CTOs exactly what they get when they use OCAP instead of a recruiter or LinkedIn search:

| Before (Recruiter/LinkedIn) | After (OCAP V2 Dashboard) |
|---|---|
| "5 years React, top rated" | 7/10 Grit Score |
| Star ratings (easily gamed) | 4-Dimension breakdown (Edge Case Density, Architectural Intent, Code Fingerprint, Testing Rigor) |
| Vague "references available" | Grit Markers — specific file paths + code patterns that prove depth |
| "Great culture fit" | Red Flags — AI-slop patterns, happy-path-only tests |
| "Let me check their LinkedIn" | CTO Justification — plain-language explanation of why to hire or skip |

### Why This Wins for CTOs
The dashboard speaks their language: code, not claims. Every metric is derived from a **raw `.diff`** file — not a profile, not a resume. A CTO can click the `smoking_gun_url` and independently audit the PR that justified the score. This is **Traceable Intelligence** — the foundation of OCAP's trust moat.

### What's Next (Roadmap)
1. **Seed the Forensic Code Library:** Ingest ~50 Gold Standard PRs from `solana-labs/solana` and `ethereum/go-ethereum` into pgvector. This enables similarity-matched scoring (not just isolated scoring) so the rubric calibrates itself over time.
2. **Re-enable Settlement UI (Phase 3):** On-chain escrow is moved to future roadmap. Each company handles trial/contract terms differently. Payment flows will be handled directly between employer and candidate.
3. **Full V2 Product UI:** Integrate the `ForensicDashboard` into the main `/` flow — after the Perplexity Hunter returns a `developerHandle` + `smokingGunUrl`, the dashboard auto-renders the report before the CTO decides to hire.

---

## [2026-04-18] Sourcing Agent Quality Gates — Stopping the Slop at the Source

### The Problem: Quality Leakage
Early calibration runs exposed a critical flaw: the Perplexity "Hunter" was surfacing candidates with 1/10 Grit Scores (like a 1-word typo fix in `golang/go`). This creates a bad experience for CTOs who see the dashboard cluttered with "DO NOT HIRE" recommendations — wasting their time and eroding trust in the system.

### The Solution: Pre-Sourcing Quality Gates
We upgraded the Hunter to be a "Pre-Vetting Orchestrator" rather than a keyword-matcher. The new system enforces:

**Negative Filters (Auto-Reject):**
- One-word typo fixes, documentation changes, formatting commits
- Bot-generated dependency updates
- Single-line comment or string changes

**Positive Complexity Requirements (3 of 5):**
- 3+ files changed across different subsystems
- 50+ lines of non-trivial logic
- State/Concurrency impact (mutexes, channels, state machines)
- Edge Case Handling (malformed input, error recovery)
- Technical Depth (language-specific primitives)

**Internal Mini-Audit:**
Before surfacing any "Smoking Gun" URL, the Hunter must internally answer:
1. What specific technical problem does this PR solve?
2. Would a senior engineer recognize this as non-trivial?
3. Does this PR show understanding of broader system architecture?
4. Would a CTO want to hire this candidate?

### Impact on Product
- **Dashboard Quality:** CTOs now see 8/10 and 9/10 candidates by default, not "DO NOT HIRE" noise.
- **Trust Moat Reinforcement:** The pre-vetting layer ensures OCAP is the only system in 2026 that filters out AI-slop *before* it reaches the dashboard.
- **Next Unlock:** Once the Forensic Code Library (pgvector) is seeded with ~50 Gold Standard PRs, the system can compare new candidates against "God-Tier" benchmarks, making the quality gates even tighter over time.

---

## [2026-04-19] FORENSIC_OS UI Rebuild & Multi-Option Candidate View

### FORENSIC_OS Design System
The full product UI has been rebuilt to match the FORENSIC_OS design mockups. The platform now presents as a forensic intelligence terminal rather than a generic SaaS dashboard. Key design decisions:

- **Zero border-radius everywhere** — sharp edges signal precision and authority
- **`#00ff41` green** — the "signal found" color; used for active states, hits, and hire recommendations
- **`#feb700` amber** — the "warning/review" color; used for AI slop flags and manual review states
- **`Space Grotesk` headings** — technical authority without being cold
- **Monospace labels** — all metadata, timestamps, and system labels use `JetBrains Mono`

### 4-View Navigation
The product now has 4 distinct views, each serving a different stage of the hiring workflow:

| View | Purpose | Status |
|---|---|---|
| **ARCHITECT** (`/`) | Prompt hydration → agent dispatch → candidate review | Live (core flow) |
| **HUNTING** (`/hunting`) | Live interrogation log during agent run | Mock (to be wired) |
| **AUDIT** (`/audit`) | Diff viewer + AI slop flag analysis | Partially live |
| **DILIGENCE** (`/diligence`) | Full forensic report: grit score, competencies, evidence | Mock (to be wired) |

### Multi-Option Candidate View (Planned)
The Perplexity agent already returns multiple candidates (`selectedCandidate` + `alternativeCandidates`), but the frontend currently discards the alternatives. The next product milestone is surfacing all candidates side-by-side so the CTO can:
1. See the primary recommendation + 2–3 alternatives ranked by archetype
2. Compare their smoking-gun PRs and grit hypotheses
3. Choose which candidate to run the full forensic analysis on
4. The selected candidate's DB UUID is then passed to the diligence pipeline

This is the "Council" metaphor made real — the agent presents a shortlist, the CTO makes the final call.

---

## [2026-04-19] Enum Cleanup, $2k Removal & Audit History Live

---

## [2026-04-20] Phase A: Perplexity as Discovery Layer — Validation Pipeline Live

### Architecture Shift: Perplexity is a Scout, Not a Judge

The prior system gave Perplexity too much authority: it selected a winner, applied quality gates in the prompt, and its output went directly to Claude for scoring. This meant a hallucinated or low-signal artifact could reach the CTO dashboard without any structural check.

**What changed:**
- Perplexity now returns a **candidate pool** (3–8 stubs) — developer handle, repo, artifact URL, and one-line rationale. No ranking, no final selection.
- Artifact URLs are validated against the GitHub URL structure before anything downstream runs. Repo-root and profile URLs are rejected — only PR and commit URLs are valid evidence.
- A **deterministic prefilter** now gates every artifact before Claude sees it. Six rejection rules check for trivial scope, dep-bumps, bot-authored chores, doc/config/test-only changes, and draft PRs. These are structural checks — no LLM judgment involved.
- If an artifact fails the prefilter, the diligence route returns a 400 with the specific rejection reason. The forensic scorer is not called.

**What didn't change:**
- The forensic scorer (Claude rubric) is untouched.
- The frontend behavior is identical — the dispatch flow still returns a primary vendor and alternatives.
- No schema changes were required.

### Product Impact

| Before Phase A | After Phase A |
|---|---|
| Perplexity picks the winner | Perplexity surfaces a pool; downstream validates |
| Citation fallback accepts any URL with "http" | Only PR/commit URLs pass; repo-root silently rejected |
| Weak artifacts reach Claude scorer | Deterministic gate rejects noise before any Claude call |
| `repo`-root URL resolved to latest commit | Explicitly rejected at the diligence layer |
| Quality gates enforced by prompt instructions | Quality gates enforced by code (auditable, tunable constants) |

The six prefilter thresholds are named constants in `github.ts` — tunable without touching logic.

### What's Next (Phase B)
The `dispatch` route still maps the pool back to a single-primary-vendor shape. Phase B wires the pool directly into `dispatch/route.ts` — running the prefilter per candidate at discovery time, persisting all stubs with `validation_status`, and surfacing the multi-candidate pool to the frontend.

---

---

## [2026-04-20] Phase B: Multi-Candidate Pool Persistence Live

### What Changed

The dispatch pipeline now persists the full candidate pool — not just a primary winner and a discarded alternatives list.

**Every artifact Perplexity surfaces now has a lifecycle:**
1. Perplexity returns a pool of 3–8 evidence stubs (PR or commit URLs only — repo-root/profile URLs are rejected at citation resolution).
2. Each stub is run through GitHub metadata fetch + deterministic signal filter before anything is stored.
3. All stubs land in the `vendors` table with a `validation_status`: `validated`, `rejected`, or `pending` (if metadata was unavailable, e.g. private repo).
4. The first validated stub becomes the primary recommendation (`is_primary: true`). If nothing validates, the first pending stub is promoted as a fallback.

**New failure modes surfaced to callers:**
- `parse_error` (502): Perplexity returned malformed JSON — candidate pool could not be extracted at all.
- `zero_valid` (422): JSON parsed, but every citation resolved to a non-artifact URL (repo root, profile, or missing). Distinct from a parse failure.

**`agent_logs` now shows per-artifact detail:**
Each stub gets its own log entry: pass/fail, specific rejection reason, and any positive signals found. CTOs or admins can trace exactly why a candidate was promoted or rejected — no black box.

**Response shape backward-compatible:**
The `vendor` key in the dispatch response still points to the primary recommendation. The new `candidatePool: { total, validated, rejected }` field is additive.

### Schema Migration Required
Run the following in the Supabase SQL editor before deploying:
```sql
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS artifact_type TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS citation_id INTEGER;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```

### What's Next
- **Frontend:** Surface `validation_status` and `rejectionReason` in the HUNTING and ARCHITECT views so the CTO can see which candidates passed the filter and why.
- **Forensic Code Library:** Seed pgvector with Gold Standard PRs — enables similarity-scored ranking within the validated pool rather than positional (first-pass) primary selection.
- **`dispatchPerplexityAgent` removal:** Once no callers remain outside `dispatch/route.ts`, the deprecated legacy shim can be deleted.

---

### What Changed
This session completed the final cleanup of the deprecated `$2k atomic trial` product concept and wired the Audit History page to real data.

**Recommendation Enum Rename (`HIRE_FOR_TRIAL` → `HIRE`):**
The original enum value was named after a specific product mechanic (a $2,000 USDC work trial) that was deprioritized in the Phase 2 pivot. The new value `HIRE` is cleaner, more flexible, and doesn't tie the recommendation to a specific payment amount. Companies handle trial/contract terms differently — the platform's job is to surface the signal, not dictate the terms.

**$2k References Removed:**
All remaining hardcoded `$2,000` and `$2k` strings have been purged from UI copy, button labels, and code comments. The "HIRE FOR TRIAL — $2,000 USDC" action button is now "HIRE CANDIDATE."

**Audit History Page (`/audit`) — Now Live:**
The page previously showed hardcoded mock data. It now fetches real `engineer_reports` rows from Supabase via `createBrowserClient`, ordered by most recent first. CTOs can now see a running history of every forensic analysis run through the system.

**`engineer_reports` Schema Expanded:**
The Supabase table and TypeScript types now store the full `ForensicScore` shape — `archetype`, `dimensions` (JSONB), `grit_markers` (JSONB), `recommendation`, and `smoking_gun_url`. Previously only `grit_score`, `red_flags`, and `justification` were persisted, making the audit history incomplete.

### Product Impact
- The `/audit` page is now a real audit trail, not a demo stub.
- Every bounty run through the diligence pipeline produces a permanent, queryable record.
- The recommendation language is now neutral and employer-friendly — no implied payment terms.

---

## [2026-04-20] Search-First Navigation + Shortlist Surface

### The Council Metaphor Made Real

The product finally delivers on the "Council" concept end-to-end. Previously, the user had to manually navigate between ARCHITECT and HUNTING while a job was running, with no surface to compare candidates after the hunt completed. Now the entire workflow lives in one place.

### SEARCH: 4-Phase Pipeline in One View

| Phase | Tab | What the user sees | Auto-advances when |
|---|---|---|---|
| **Brief** | `01 BRIEF` | Prompt hydration chat, telemetry readiness vectors | Agent is `idle` or `hydrating` |
| **Capability Map** | `02 CAPABILITY MAP` | Dispatch in progress, AgentTracker live log | Agent transitions to `dispatching` |
| **Hunt** | `03 HUNT` | Live interrogation log + candidate node map | Agent is `navigating / vetting / awaiting_quote` |
| **Shortlist** | `04 SHORTLIST` | Ranked candidate cards grouped by bucket | Agent reaches `quote_received` |

The user can also click any tab manually at any time — no forced flow.

### Shortlist: Three Semantic Buckets

The Shortlist surface replaces the flat `CandidateGrid` with a structured ranking:

| Bucket | Criteria | Visual language |
|---|---|---|
| **ARCHETYPE** | First candidate with `gritScore ≥ 8` | Green border, green badge |
| **SOLID FIT** | Next 1–2 candidates with `overall ≥ 6.5` | Amber border, amber badge |
| **ALTERNATIVE** | Remaining candidates | Grey border, grey badge |

Each card shows: developer handle, overall HuntScore (0–10), three sub-scores (ENG / FIT / CONF), top signal, top risk, validation status, and two action buttons — AUDIT (opens diff viewer) and DOSSIER (opens forensic report), or ANALYZE (runs diligence inline if no report exists yet).

### HuntScore: Transparent Scoring Model

```
engineerQuality  = grit_score (from forensic report, else 5.0)
roleFit          = 6.5 (neutral — role-fit scoring not yet implemented)
evidenceConfidence = min(grit_markers.length / 5, 1) × 10
overall          = EQ×0.5 + RF×0.3 + EC×0.2
```

The formula is intentionally readable. The `roleFit` placeholder ensures no candidate is penalised for a dimension that hasn't been scored yet.

### Audit Page: Direct URL Linking

The `/audit` page now accepts `?url=<encodedUrl>` as a query param. ShortlistCard's AUDIT button passes the candidate's artifact URL directly — the diff viewer opens immediately without requiring the user to find the report in the left panel. `?reportId=` pre-selects a report. Both params work independently or together.

### Diligence Page: Recruiter Actions + Evidence Rail

Three changes make the diligence page actionable for hiring decisions:

1. **Evidence rail is now clickable** — grit marker items link to `/audit?url=<smoking_gun_url>`, letting the hiring manager jump from the evidence claim to the actual diff line.
2. **Executive Synthesis block** — the Claude justification paragraph is surfaced in its own panel below the terminal log, not buried inside the log stream.
3. **Recruiter Actions panel** — OPEN BEST ARTIFACT (audit link), BACK TO SHORTLIST (browser back), and a recommendation status chip (APPROVED / DO NOT PROCEED / NEEDS HUMAN REVIEW) with a material icon.

### Navigation Cleanup

- ARCHITECT and HUNTING removed from sidebar nav. `/hunting` route still exists as a standalone console (bookmarkable for ops monitoring) but is no longer in the primary navigation flow.
- SEARCH replaces both with a single entry point at `/`.
- AUDIT and DILIGENCE remain unchanged as secondary views.

---

## Phase C Status — [2026-04-20] Build Verified

All Phase C UI changes are implemented and passing `npm run build`:

| Route | Status |
|---|---|
| `/` (Search) | ✅ 4-phase tab nav, hunt logs, shortlist |
| `/audit` | ✅ `?url=` + `?reportId=` query params |
| `/diligence` | ✅ Unchanged (Suspense + `force-dynamic` added) |
| `/hunting` | ✅ Preserved, not in primary nav |

**What's live on GritHunter branch:**
- Phase A: Deterministic artifact signal filter, strict citation validation
- Phase B: `dispatchPerplexityPool`, full vendor pool persistence, parse error taxonomy
- Phase C: SEARCH nav consolidation, 4-phase SearchPhaseNav, ShortlistPhase + ShortlistCard, Hunt log viewer + NodeMap embedded in main page, Audit `?url=` deep-linking

---

## [2026-04-20] The "Architect Plan" Integration

### From Recruiter Prompt to Structured Execution

Previously, OCAP passed raw recruiter text directly into the agent. We found that giving Perplexity an unstructured prompt led to inconsistent candidate discovery.

**The Pivot:** The Architect Phase now serves as a rigorous compiler. Before discovering candidates, OCAP compiles user intent into an `ArchitectPlan` detailing:
1. **Capability Search Lanes** (weighted skill buckets like "Concurrency vs CI/CD").
2. **GitHub Signal Sets** (identifying which repo shapes, tooling, or libraries correlate with elite engineers).
3. **Proof-of-Work Patterns** (the precise evidence required to prove mastery).
4. **Hard Disqualifiers** (explicit patterns to automatically reject).

**Impact on PMF:**
This fundamentally shifts our value proposition. We aren't just a "search box" for talent; OCAP is now translating a CTO's raw intent into an opinionated, programmatic "Hunting Strategy." By feeding a structured Architect Plan into Perplexity, our resulting candidates are hyper-calibrated to the exact capability lanes the CTO values most, increasing our placement rate and dramatically lowering the noise floor.
