# Engineering Diary (eng.md)

**Purpose:** Technical record of "how" and "why."
**Rules:** Proactively append logs after major tool calls, structural pivots, or significant architectural decisions.

---

## [2026-04-17] Project Initialization

### 1. Repository Setup
*   Initialized repository `ronithryal/ocap-council`.
*   Pushed initial `stack.md` and established core principles (decoupling intent via Transformer/Execution).

### 2. Prompt Architecture
*   Added `brockman.md` to define the "Brockman Formula" for hydration.
*   Updated `stack.md` to link the hydration phase to the o1-prompting methodology.

### 3. Infrastructure Pivot: Dropping Privy for CDP
*   **Decision:** Replaced Privy with **Coinbase Embedded Wallets (CDP)** as the primary settlement infrastructure.
*   **Technical Rationale:** 
    *   **Unit Economics:** Usage-based pricing ($0.005 per signing operation) is significantly more predictable and scalable for an agentic bounty engine than Privy's MAU-based tiers.
    *   **Ecosystem Alignment:** Native integration with Base (our target L2) and Coinbase Pay streamlines the on/off-ramp for bounty payouts.
    *   **MPC Security:** Leveraging Coinbase's institutional MPC infrastructure rather than client-side key reconstruction.

### 4. Perplexity "Computer" Architecture Upgrade
*   **Initial Implementation:** Used `sonar-deep-research` via basic `/chat/completions`.
*   **The Problem:** `sonar-deep-research` is heavily system-prompted internally to generate massive markdown academic reports. When forced to output JSON, the model suffered an internal instruction conflict, resulting in it dumping raw `<think>` vectors to the UI and failing schema validation.
*   **The Pivot:** Transitioning to the true "Perplexity Computer" methodology—the **Perplexity Agent API**. 
    *   **How it works:** We use an orchestrator LLM (like GPT-5x or Claude) and explicitly pass `{ "type": "web_search" }` as an autonomous tool. 
    *   **Why it works:** It decouples the Search Action from the Output Formatting, allowing the agent to gather Github/LinkedIn facts using Perplexity's engine, but using the generation layer purely to structure the JSON.

### 5. Backend Fixes & Error Handling
*   Disabled the mandatory wallet connection on the initial frontend prompt to drastically reduce UX friction.
*   Updated `api/bounty`, `api/bounty/[id]/dispatch`, and the Perplexity `webhook` to use the `SUPABASE_SERVICE_ROLE_KEY` to bypass Row-Level Security during agentic operations and correctly generate fallback UUIDs for unauthenticated users.

### 6. Correcting the Perplexity API Payload (v1/agent)
*   **The Problem:** The initial payload to `chat/completions` crashed because reasoning models rejected restrictive API overrides and failed JSON-formatting due to hallucinating URLs.
*   **The Resolution:** Successfully transitioned to the true orchestration layer (`POST /v1/agent`). Based on the official 2026 Prompt Guide, we removed the demand for the Language Model to write exact URL strings out, as this causes massive context-window hallucination.
*   **Citation Architecture:** The model is now instructed to output numerical brackets (e.g., `"githubUrl": "[2]"`) representing sources. `parseVendorFromResponse` then executes a cross-reference map, capturing the exact, non-hallucinated URL from the `data.output.search_results` JSON array returned by the Perplexity API.

### 7. Interactive Hydration Pipeline
*   **Implementation:** Added a two-stage "Prompt Architect" flow using `/api/bounty/analyze`.
*   **Workflow:** User inputs are first passed to a reasoning agent that audits the prompt against the Brockman Formula. 
*   **State Machine:** Integrated a `hydrating` phase into the `page.tsx` state machine, enabling an LLM-led chat session to "fill the gaps" (Goal, Format, Context) before the expensive Perplexity tool-call occurs. 
*   **Optimization:** This prevents "garbage-in/garbage-out" failures and significantly improves the quality of the final JSON quote cards.

### 8. Vertical Vetting Blueprints
*   **Architecture:** Created `Digital Platform Vetting Classification Tree.md` as the blueprint for our multi-industry expansion.
*   **Managed vs. Open:** Segmented marketplaces into "Managed" (e.g., Craftwork, Style Me Pretty) where the platform verifies the artifact, and "Open" (e.g., GitHub, Behance) where the Agent must perform the raw audit.
*   **Expansion:** Integrated deep research on Home Service 2.0 (Angi Services, Honey Homes) and the SaaS infrastructure layer (ServiceTitan) that makes physical labor "API-Ready."
*   **Thumbtack Integration:** Mapped specific trust indicators (Top Pro, Background Checks) for the Agent to verify during pro-search dispatches.

### 9. Interactive Chatbot UI
*   **State Management:** Built `HydrationChat.tsx` using Framer Motion to handle the conversational state machine.
*   **Integration:** Replaced the static `BountyInput` submit with a conditional `hydrating` phase, ensuring the agent has high-fidelity instructions before hitting the Perplexity v1/agent API.

---

## [V2 Pivot] Execution Phase

### 10. The V2 Pivot & Branching Strategy
*   **Decision:** Shifted OCAP from generalized marketplace routing to a **Forensic Behavioral Engine** focused entirely on GitHub-native technical diligence. Read `product.md` (Section 9) or the `implementation_plan.md` artifact for the strategic rationale ("AI-slop crisis").
*   **Action:** Initialized the `v2-forensic-engine` branch.
*   **Next Steps:** Proceeding to refactor the Perplexity Agent payload to hunt exclusively for behavioral markers in GitHub PRs (Task 1: The "Brockman-Sourcing" Agent).

---

## [2026-04-18] Forensic Diligence Pipeline — E2E Working

### 11. Task 3 Complete: End-to-End Diligence Verified on Real PRs

Built out and debugged the full pipeline: `perplexity.ts` (Hunter) → `github.ts` (Diff Fetcher) → `forensic-scorer.ts` (Claude rubric) → `/api/bounty/[id]/diligence` route.

**Bugs fixed this session:**
*   **Claude 404:** `forensic-scorer.ts` was pinned to `claude-3-5-sonnet-20241022`, which the account 404s on. Swapped to `claude-sonnet-4-5` with `ANTHROPIC_MODEL` env override so we can rotate without a code change.
*   **HTML-as-diff footgun:** `github.ts` had a fallback to `patch-diff.githubusercontent.com`/`github.com/.../*.diff` for 404s. Those URLs now return a 1500-line HTML 404 page that the stripper happily fed to Claude as "diff content." Killed the fallback entirely; we now rely on the authenticated REST API with `Accept: application/vnd.github.v3.diff`. Added a sanity check that throws fast if the response body doesn't start with `diff --git` or `From ` (git-format-patch header).
*   **GitHub token:** Generated a Classic PAT scoped to `public_repo` only. Rate limit 60/hr → 5000/hr.

**Calibration runs (both completed end-to-end, structured output via Claude tool-use):**
*   `golang/go#78798` (1-word typo in a panic message) → **gritScore 1/10, DO_NOT_HIRE, "noise not signal."** Rubric correctly refuses to greenlight the $2k.
*   `rust-lang/rust#135179` (method dispatch / vtable work in `rustc_hir_typeck`) → **gritScore 7/10, NEEDS_HUMAN_REVIEW, classified as State Architect.** Grit markers quoted specific file paths and named the autoderef/use_receiver_trait machinery.

The rubric is behaving exactly as designed: skeptical by default, rewards domain-aware naming and explicit invariants, flags happy-path-only tests.

### 12. Open Infra Debt (carry forward to V2 Dashboard work)
*   6 pre-existing TS errors in `HydrationChat.tsx` and `EscrowButton.tsx` (wagmi API drift, `Message` role typing). None touch the new pipeline; park until UI rebuild.
*   Forensic Code Library (pgvector seed set of "Gold Standard" PRs) still empty. Diligence currently scores in isolation; similarity search against the library is the next big unlock for calibration.
*   Settlement side (Task 4 — $2k USDC escrow on Base tied to `HIRE_FOR_TRIAL`) untouched.


