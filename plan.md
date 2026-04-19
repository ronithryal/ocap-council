# OCAP Council - Project Plan

> **Last Updated:** April 19, 2026

## Overview
OCAP Council is a Forensic Behavioral Intelligence platform that hunts for elite technical talent ("Grit") using the Perplexity Agent API (`v1/agent`) for live web research and Claude 3.5 Sonnet for forensic code diff scoring. The UI is a full-bleed FORENSIC_OS design system with 4 views: Architect, Hunting, Audit, Diligence.

## Completed Steps

### Phase 1: Core Vetting Engine
- [x] Perplexity `v1/agent` integration with `web_search` tool and Brockman Formula prompt
- [x] Forensic Code Labeler (Grit Scoring via Claude 3.5 Sonnet)
- [x] Bounty creation and dispatch flow (`/api/bounty`, `/api/bounty/[id]/dispatch`)
- [x] Diligence pipeline (`/api/bounty/[id]/diligence`) — GitHub diff fetch → Claude scoring → Supabase persist
- [x] Mock agent for demo (`src/lib/mock/agent.ts`)

### Phase 2: Candidate Connection
- [x] Remove hardcoded $2k trial amount from all prompts and UI
- [x] Flexible quote/budget handling
- [x] Direct "Hire/Contact" flow (escrow deprioritized)

### Phase 3: FORENSIC_OS UI Rebuild (April 19, 2026)
- [x] Sidebar rebuilt to match FORENSIC_OS design (amber logo, INIT_SCAN CTA, 4 nav items)
- [x] Layout stripped to full-bleed (pages manage their own `ml-[240px]` + top bar)
- [x] **Architect page** (`/`) — 3-col: Session Map · Chat/Input · Prompt Telemetry panel
- [x] **Hunting page** (`/hunting`) — Live Interrogation Log + Active Targets Node Map + source breakdown
- [x] **Audit page** (`/audit`) — Diff viewer (3-col: Grit Markers · Diff · AI Slop Flags), live Supabase data
- [x] **Diligence page** (`/diligence`) — 3-col: Grit Score · Core Competencies · Traceable Evidence + terminal log
- [x] Fix: dispatch route now returns real vendor DB UUID → diligence 404 resolved

## Active Issues / Known Bugs

- [ ] **Diligence 404 on old bounties** — bounties created before the vendor-id fix (`bd68e87`) will still 404 on diligence. New dispatches are correct.
- [ ] **Perplexity `v1/agent` endpoint** — needs validation that `preset: "pro-search"` and `tools: [{ type: "web_search" }]` are the correct field names for the current API version. If the agent returns a non-200, check `eng.md` for the latest schema.
- [ ] **HydrationChat** — the Brockman Formula hydration flow is wired but the telemetry panel (Clarity Score, Constraint Density, Ambiguity Index) is still static mock data. Should update in real-time as the user types/answers questions.

## Next Steps

### Immediate (P0)
- [ ] **Wire Prompt Telemetry to live state** — `clarity`, `constraint`, `ambiguity` scores in the right panel of the Architect page should update as the user types their bounty description (can use a lightweight heuristic: word count, question marks, technical keyword density)
- [ ] **Session Map persistence** — save completed bounty sessions to Supabase and render them in the left panel of the Architect page (currently hardcoded mock data)
- [ ] **Hunting page live data** — replace mock log entries with real `agent_logs` rows from Supabase (poll or subscribe via Supabase Realtime) for the active bounty
- [ ] **Audit page diff viewer** — when a real `engineer_report` is selected from the left panel, fetch the actual GitHub diff via `/api/bounty/[id]/diligence` and render it in the center diff viewer (currently always shows the mock Rust diff)

### Short-term (P1)
- [ ] **Supabase Realtime on agent_logs** — replace the polling pattern in AgentTracker with a Supabase channel subscription so phase transitions appear live without page refresh
- [ ] **Alternative candidates (multi-option view)** — the dispatch route already returns `alternativeCount` and `alternativeVendors` from Perplexity, but the frontend currently discards them. The user should be able to see all returned candidates side-by-side (primary + alternatives), compare their archetypes and smoking-gun PRs, and choose which one to run forensic analysis on. Surface as a ranked candidate list / card grid below the primary QuoteCard in the Architect view, with a "Run Forensic Analysis" CTA on each card. The selected candidate's `id` is then passed to the diligence pipeline.
- [ ] **Diligence page live data** — `/diligence` currently shows mock data. Wire it to the most recent `engineer_report` from Supabase for the active bounty, or accept a `?reportId=` query param
- [ ] **Error recovery** — if the Perplexity agent returns a non-JSON response (hallucinated markdown, rate limit, etc.), the fallback vendor object should be surfaced more gracefully in the UI with a "Raw Agent Output" expandable section

### Medium-term (P2)
- [ ] **Hunting page node map** — replace the static SVG nodes with a real graph of GitHub repos/users discovered during the agent run (pull from `agent_logs.metadata`)
- [ ] **Multi-bounty dashboard** — a list view of all bounties with their current `agent_phase` status, accessible from the Session Map
- [ ] **Candidate profile page** — a dedicated route `/candidate/[handle]` that shows the full forensic report, diff viewer, and hire/pass CTA

### Phase 4: Settlement (Deprioritized / Future)
- [ ] On-chain escrow via Base/CDP
- [ ] USDC payment flows
- [ ] Multi-party settlement logic
- [ ] Vendor mobilization tracking

### Phase 5: Scale (Future)
- [ ] Multi-category support (video, legal, marketing, etc.)
- [ ] Vendor reputation oracle
- [ ] Dispute resolution

## Architecture Notes

### Agent Pipeline
```
User Input → BountyInput → HydrationChat (Brockman Formula)
  → POST /api/bounty (create)
  → POST /api/bounty/[id]/dispatch
      → Perplexity v1/agent (web_search, pro-search)
      → parseVendorFromResponse (citation resolver)
      → INSERT vendors (returns real UUID)
  → POST /api/bounty/[id]/diligence
      → fetchCleanDiff (GitHub raw diff)
      → scoreForensicDiff (Claude 3.5 Sonnet)
      → INSERT engineer_reports
```

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/perplexity.ts` | Brockman Formula prompt + `v1/agent` call + citation resolver |
| `src/lib/forensic-scorer.ts` | Claude 3.5 Sonnet Grit-vs-Slop rubric |
| `src/lib/github.ts` | Raw diff fetcher + boilerplate stripper |
| `src/app/api/bounty/[id]/dispatch/route.ts` | Perplexity dispatch + vendor DB insert |
| `src/app/api/bounty/[id]/diligence/route.ts` | Full forensic pipeline |
| `src/app/page.tsx` | Architect view (3-col layout) |
| `src/app/hunting/page.tsx` | Hunting view (live log + node map) |
| `src/app/audit/page.tsx` | Audit view (diff viewer) |
| `src/app/diligence/page.tsx` | Diligence view (grit score + evidence) |

## Notes
- Escrow is a valid feature but each company handles trials/contracts differently. The platform should facilitate *finding* and *vetting* without mandating a specific payment flow.
- The forensic approach to evaluating "Grit" remains the core value proposition.
- The FORENSIC_OS design system uses: `#0b0e14` bg, `#00ff41` green, `#feb700` amber, `Space Grotesk` for headings, `JetBrains Mono` / `Roboto Mono` for code/labels, zero border-radius everywhere.
