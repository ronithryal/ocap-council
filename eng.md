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
