# OCAP Council - Project Plan

> **Last Updated:** April 18, 2026

## Overview
OCAP Council is an On-Chain Agentic Procurement platform that automates the sourcing and vetting of elite technical talent ("Grit") using AI agents (Perplexity Sonar) and forensic code analysis.

## Current Objective
Remove the hardcoded $2,000 work trial concept and deprioritize the on-chain escrow feature. Companies handle trial/work periods differently, so the platform should be flexible and focus on connecting employers with vetted candidates.

## Completed Steps
- [x] Initial discovery and analysis of $2k and escrow references in codebase

## TODO List
- [x] Create `plan.md` to document the revised plan and roadmap
- [x] Remove $2k references from Perplexity agent prompts and parsing logic in `src/lib/perplexity.ts`
- [x] Update AI scoring prompt in `src/lib/forensic-scorer.ts` to remove $2k trial context
- [x] Update `EscrowButton.tsx` UI text to deprioritize escrow
- [x] Update `QuoteCard.tsx` to remove "Fixed Quote" and escrow-centric footers
- [x] Update `src/app/page.tsx` success messaging to be more generic
- [x] Scrub hardcoded justifications in `src/app/forensic-demo/page.tsx` of $2k mentions
- [x] Update mock agent steps in `src/lib/mock/agent.ts`
- [x] Move Escrow to future roadmap in `product.md`

## Implementation Details

### 1. Perplexity Agent (`src/lib/perplexity.ts`)
**Changes:**
- Remove "Would this PR pass the 'CTO Test' — would a CTO pay $2k to trial this candidate?" from prompt
- Remove "The atomic trial unit is a $2k USDC contract" from prompt
- Change `quoteAmount: 2000` to use `task.maxBudget` or a dynamic value
- Keep the gritty vetting criteria, just remove the dollar amount framing

### 2. Forensic Scorer (`src/lib/forensic-scorer.ts`)
**Changes:**
- Remove "evaluating whether a CTO should spend $2,000 USDC on a 2-week trial contract"
- Reframe the evaluation as "would a CTO want to hire this engineer" without a dollar amount

### 3. EscrowButton (`src/components/wallet/EscrowButton.tsx`)
**Changes:**
- Button text: "Hire & Lock Funds (Gasless)" → "Hire Candidate"
- Status message: "parked until V2 Dashboard rebuild" stays
- Future: Move to V2 roadmap

### 4. QuoteCard (`src/components/settlement/QuoteCard.tsx`)
**Changes:**
- "Fixed Quote" label → "Candidate Rate" or remove
- Footer: "Settled via USDC Escrow (on-chain)" → "Payment terms set by employer"

### 5. Main Page (`src/app/page.tsx`)
**Changes:**
- "USDC Locked in escrow. Vendor notified for mobilization." → "Candidate hired. Team notified for onboarding."

### 6. Forensic Demo (`src/app/forensic-demo/page.tsx`)
**Changes:**
- Scrub all $2,000 references from mock justifications

### 7. Mock Agent (`src/lib/mock/agent.ts`)
**Changes:**
- "Generating summary and deposit escrow link" → "Generating summary and contact details"

## Roadmap

### Phase 1: Core Vetting Engine (Current)
- [x] Perplexity Sonar Agent integration
- [x] Forensic Code Labeler (Grit Scoring)
- [x] Bounty creation and dispatch flow
- [x] Mock agent for demo
- [x] Basic UI with hydration flow

### Phase 2: Candidate Connection (Completed)
- [x] Remove hardcoded $2k trial amount
- [x] Flexible quote/budget handling
- [x] Direct "Hire/Contact" flow (deprioritize escrow)

### Phase 3: Settlement (Future / Deprioritized)
- [ ] On-chain escrow via Base/CDP (originally V2 Cynical Dashboard)
- [ ] USDC payment flows
- [ ] Multi-party settlement logic
- [ ] Vendor mobilization tracking

### Phase 4: Scale (Future)
- [ ] Multi-category support (video, legal, marketing, etc.)
- [ ] Vendor reputation oracle
- [ ] Dispute resolution

## Notes
- Escrow is a valid feature but each company handles trials/contracts differently. The platform should facilitate the *finding* and *vetting* without mandating a specific payment flow.
- The forensic approach to evaluating "Grit" remains the core value proposition and should be preserved regardless of payment model.
