# OCAP Council - Project Plan

> **Last Updated:** April 19, 2026 — 03:05 AM

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
- [x] **HydrationChat telemetry** — resolved via `computeTelemetry()` heuristic + `onDescriptionChange` prop on `BountyInput`. Clarity, Constraint Density, Ambiguity Index all update live as user types. Commit `91b7c39`.

## Next Steps

### ✅ Done (P0 — April 19, 2026)
- [x] Wire Prompt Telemetry to live state (`computeTelemetry()` heuristic, `onDescriptionChange` prop) — `91b7c39`
- [x] Session Map loads from Supabase `bounties` table — `91b7c39`
- [x] Hunting page wired to Supabase Realtime `agent_logs` — `91b7c39`

### 🔴 Now (P1 — Next Session)
- [ ] **Audit diff viewer — wire to real GitHub diff** — when a report is selected in the left panel, call `fetchCleanDiff(report.smoking_gun_url)` via a new `GET /api/bounty/diff?url=` route and render the real diff in the center viewer. Replace the hardcoded Rust mock entirely.
- [ ] **Alternative candidates (multi-option view)** — surface `alternativeVendors` from the dispatch response as a ranked card grid below the primary QuoteCard. Each card has a "Run Forensic Analysis" CTA. The selected card's vendor `id` is passed to the diligence pipeline. This is the "Council" metaphor — agent presents a shortlist, CTO picks.
- [ ] **Diligence page live data** — accept `?reportId=` query param, fetch from `engineer_reports`, render real grit score, competencies (from `dimensions` JSONB), evidence (from `grit_markers` JSONB), and terminal log from `agent_logs`.
- [ ] **Supabase Realtime on AgentTracker** — replace the prop-passed `logs[]` pattern with a live Supabase channel subscription on `agent_logs` filtered by `bounty_id`, so the tracker updates without needing the parent to poll.

### 🟡 Soon (P2)
- [ ] **Error recovery UI** — if Perplexity returns non-JSON (rate limit, hallucinated markdown), surface a "Raw Agent Output" expandable section in the Architect view instead of a generic error state.
- [ ] **Hunting page node map** — replace static `<div>` nodes with a real graph of GitHub repos/users from `agent_logs.metadata` (keptFiles, developerHandle, smokingGunUrl).
- [ ] **Multi-bounty dashboard** — list view of all bounties with `agent_phase` status badges, accessible from the Session Map left panel.
- [ ] **Candidate profile page** — `/candidate/[handle]` route showing full forensic report, diff viewer, and hire/pass CTA.

### 🔵 Future (P3+)
- [ ] On-chain escrow via Base/CDP (USDC payment flows, multi-party settlement)
- [ ] Forensic Code Library (pgvector) — seed ~50 Gold Standard PRs for similarity-matched scoring
- [ ] Multi-category support (video, legal, marketing, etc.)
- [ ] Vendor reputation oracle + dispute resolution

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
