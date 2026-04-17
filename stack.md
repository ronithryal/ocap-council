# OCAP Council: B2B Bounty Engine Stack & Principles

## 1. Tech Stack (The Infrastructure)
* **GitHub:** https://github.com/ronithryal/ocap-council
* **Frontend/Framework:** Next.js 15 (App Router) + Vercel AI SDK (`useChat`).
* **The "Worker" Engine:** **Perplexity Computer API**. (Handles autonomous web navigation, GUI-level vendor discovery, and outreach).
* **Orchestration:** `streamText` with **Council-Governed Logic** in `api/chat/route.ts`. 
* **Model Council (The Registry):**
    * `google('gemini-2.0-flash')` -> **TRANSFORMER_MODE**: The "Pre-Processor." Hydrates user intent with corporate facts and security requirements before dispatching tasks to Perplexity.
    * `openai('deepseek-v3')` -> **EXECUTION_LOGIC**: High-precision reasoning for parsing PDF quotes and verifying smart contract escrow parameters.
    * `veniceAI('hermes-3')` -> **THE PRINCIPAL (Verification Layer)**: Cross-references Perplexity's findings. Validates vendor "Proofs of Work" and audits the agent's decision to release USDC.
* **Database & Memory:** Supabase (Postgres) + **Weighted Memory Engine** (Stores vendor reputations, previous bounty results, and audit logs).
* **Settlement Layer:** **Privy** (Embedded Wallets) + **Base L2** (USDC Escrow Contracts).
* **Styling:** Tailwind CSS + Shadcn UI (The "Agentic Terminal" dashboard).
* **Privacy & TEE:** Venice.ai (API scrubbing) & NEAR AI (Confidential execution of contract release logic).

## 2. Boris Cherny’s Rules (Agentic Discipline)
* **Planning is Mandatory:** * Separate the **Planning** phase from the **Execution** phase. 
    * The agent must produce a written plan for every non-trivial task. 
    * Do not write code until the plan is reviewed/validated against the `stack.md` and `plan.md`. 
* **Thread-Based Engineering:** * Operate in parallel "threads" of thought. Use **Terminal Agents** for the inner-loop (writing/editing/testing code) and **Web/Cloud Agents** for out-of-loop tasks (researching docs, checking API statuses).
* **Closed-Loop Verification (Test-Driven):** * Adhere to a strict **Generate -> Verify -> Read -> Fix** loop. 
    * An agent must never assume code works. It must run the code, capture the exact error output, and reason through the failure before attempting a second fix.
* **Types Over Implementation:** * Prioritize **Type Safety** (TypeScript/Python Types) as the primary architectural guardrail. 
    * Define interfaces and data shapes before implementing business logic to prevent "agent slop" and state corruption.
* **Build for the Future (Anticipatory Design):** * Do not optimize for today's model limitations (e.g., small context windows). 
    * Architect for the model 6 months out: assume **infinite context**, **perfect reasoning**, and **zero-latency** tool calls.
* **Unlimited Tokens, Minimal People:** * Favor **Compute Over Labor**. Spend tokens on multi-step reasoning, exhaustive testing, and redundant self-reflection rather than requiring human intervention. 
    * Maximize developer velocity by offloading all "plumbing" to the agentic loop.
* **Active learning** Learn from mistakes and past learnings, and proactively update the log. 

## 3. Engineering Diary (eng.md)
* **Purpose:** Technical record of "how" and "why."
* **Updates:** Proactively appends logs after major tool calls or pivots.

## 4. Product Manager Diary (product.md)
* **Purpose:** Strategic record of "what" and "for whom."
* **Updates:** Proactively appends hypotheses on PMF and monetization hooks.

## 5. The Hydration Pipeline (Compiler Architecture)

We strictly decouple **User Intent** from **Model Execution** (following the **Brockman Formula** in `brockman.md`) to prevent sycophancy and context-drift. 

### **A. The Transformer Agent (The Pre-Processor)**
- **Role:** Parsing and Hydrating Bounty Requirements.
- **Model:** Gemini 3 Flash.
- **Function:** Intercepts the raw user request (e.g., "Need an auditor"), fetches `CompanyCompliance` facts from Supabase, and compiles a structured instruction for the Perplexity Computer to find specific *verifiable* credentials.

### **B. The Model Council (The Execution Engine)**
- **Role:** Reasoning, Payout Verification, and Output.
- **Models:** DeepSeek-V3 (The Brain), Hermes-3 (The Principal).
- **Function:** The **Brain** evaluates the vendor's PDF quote. The **Principal** audits that evaluation against the original budget and security constraints before the user is ever prompted to sign the transaction.