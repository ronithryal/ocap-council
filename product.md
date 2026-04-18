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
*   **The Moat:** OCAP’s value is **Audited Settlement.** We don't just "find" humans; we provide an **Autonomous Procurement Ledger.** 
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
*   **The "AI-Slop" Crisis:** In 2026, the real problem CTOs face is not finding *a* developer, but finding the 1% who possess deep architectural "Grit." The market is flooded with engineers generating unvetted, generic boilerplate using LLMs (AI-slop).
*   **The V2 Moat (Forensic Behavioral Engine):** OCAP is now a **High-Precision Talent Weapon**. We no longer match via generic keywords. We use Perplexity to hunt for specific behavioral markers on GitHub (e.g., fixing race conditions, high-complexity refactoring) and run candidates through a **Semantic Feature Store**.
*   **Recursive Learning Loop:** We evaluate candidates' raw `.diff` files against a database of "God-Tier" code. By dynamically ingesting new high-scoring PRs when a CTO bets money on a candidate (via a $2k USDC Trial Contract), our autonomous vetting logic physically evolves, ensuring OCAP's definitions of "Good Code" constantly outpace the rise of AI-generated noise.

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
| "Let me check their LinkedIn" | CTO Justification — plain-language explanation of why to spend or skip the $2k |

### Why This Wins for CTOs
The dashboard speaks their language: code, not claims. Every metric is derived from a **raw `.diff`** file — not a profile, not a resume. A CTO can click the `smoking_gun_url` and independently audit the PR that justified the score. This is **Traceable Intelligence** — the foundation of OCAP's trust moat.

### What's Next (Roadmap)
1. **Seed the Forensic Code Library:** Ingest ~50 Gold Standard PRs from `solana-labs/solana` and `ethereum/go-ethereum` into pgvector. This enables similarity-matched scoring (not just isolated scoring) so the rubric calibrates itself over time.
2. **Re-enable Settlement UI:** Once the V2 Dashboard is fully wired, rebuild `EscrowButton.tsx` with the correct OnchainKit v1.x API to enable the `$2,000 USDC HIRE FOR TRIAL` transaction via CDP Paymaster.
3. **Full V2 Product UI:** Integrate the `ForensicDashboard` into the main `/` flow — after the Perplexity Hunter returns a `developerHandle` + `smokingGunUrl`, the dashboard auto-renders the report before the CTO decides to hire.
