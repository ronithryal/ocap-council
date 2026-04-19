# Next Session — Agent Instructions

> **For:** Cline / Claude agent starting a new session on OCAP Council  
> **Branch:** `GritHunter`  
> **Last commit:** see `git log --oneline -5`  
> **Dev server:** `npm run dev` (already running on port 3000)

---

## Context Snapshot

OCAP Council is a Forensic Behavioral Intelligence platform. The full pipeline is:

```
User types prompt → HydrationChat (Brockman Formula clarifying questions)
  → POST /api/bounty (create in Supabase)
  → POST /api/bounty/[id]/dispatch (Perplexity v1/agent → vendor inserted to DB)
  → POST /api/bounty/[id]/diligence (GitHub diff → Claude 3.5 Sonnet → engineer_reports)
```

The UI has 4 views: ARCHITECT (`/`), HUNTING (`/hunting`), AUDIT (`/audit`), DILIGENCE (`/diligence`).

Read `report.md` for the full live-vs-mock audit. Read `plan.md` for the prioritized backlog.

---

## What Was Just Fixed (This Session)

1. **Hunting page "no active sessions"** — was filtering out `quote_received` bounties. Fixed: now auto-selects `data[0]` (most recent, any phase). Commit `91b7c39`.
2. **Diligence 500 on repo URLs** — `github.ts` threw `Unrecognized GitHub URL` for `https://github.com/owner/repo` (no PR/commit path). Fixed: added `kind: 'repo'` to `ParsedGitHubUrl`, resolves to latest commit SHA via `GET /repos/{owner}/{repo}/commits?per_page=1` before fetching diff. Commit pending.

---

## 🔴 P1 — Do These First (Next Session)

### 1. Audit Diff Viewer — Wire to Real GitHub Diff

**File:** `src/app/audit/page.tsx`  
**Problem:** The center diff viewer always shows a hardcoded Rust `processor.rs` mock diff regardless of which report is selected.  
**Fix:**
- Create a new API route: `GET /api/bounty/diff?url=<encoded_github_url>`
  - File: `src/app/api/bounty/diff/route.ts`
  - Calls `fetchCleanDiff(url)` from `src/lib/github.ts`
  - Returns `{ lines: Array<{ type: 'add'|'remove'|'context', content: string, lineNum: number }> }`
- In `audit/page.tsx`, when `activeReport` changes, fetch from this route using `activeReport.smoking_gun_url`
- Render the real diff lines in the center panel (replace `MOCK_DIFF`)
- Show a loading state while fetching

### 2. Alternative Candidates Multi-Option View

**File:** `src/app/page.tsx`, `src/app/api/bounty/[id]/dispatch/route.ts`  
**Problem:** Perplexity returns `alternativeVendors` but the frontend discards them entirely.  
**Fix:**
- In `dispatch/route.ts`: also insert alternative vendors to the `vendors` table with `is_primary: false` (add this column to schema), return them in the response as `alternatives: [{ id, name, credentials, githubUrl, summary }]`
- In `page.tsx`: store `alternatives` in state alongside `vendor`
- After `QuoteCard` renders the primary, show a `CandidateGrid` below it:
  - Each card: name, credentials badge, smoking gun URL, "Run Forensic Analysis" CTA
  - Clicking a card sets that vendor as the active one and calls `runForensicAnalysis()`
- This is the "Council" metaphor — agent presents a shortlist, CTO picks

### 3. Diligence Page Live Data

**File:** `src/app/diligence/page.tsx`  
**Problem:** 100% mock data (hardcoded `MOCK_REPORT` with `gritScore: 96.8`).  
**Fix:**
- Accept `?reportId=` query param via `useSearchParams()`
- If no `reportId`, fetch the most recent `engineer_reports` row from Supabase
- Map the real data:
  - `grit_score` → big number display
  - `archetype` → badge
  - `recommendation` → verdict box color (HIRE=green, NEEDS_HUMAN_REVIEW=amber, DO_NOT_HIRE=red)
  - `dimensions` (JSONB) → competencies grid (keys become labels, values become scores/grades)
  - `grit_markers` (JSONB) → evidence list
  - `red_flags` (JSONB array) → warn flags
  - `justification` → terminal log entry
- Also fetch `agent_logs` for the bounty and render them in the terminal log section

### 4. Supabase Realtime on AgentTracker

**File:** `src/components/tracker/AgentTracker.tsx`, `src/app/page.tsx`  
**Problem:** `AgentTracker` receives `logs` as a prop from `page.tsx`. The parent polls/appends manually. This means logs only appear when the parent's `fetch` calls complete — not in real-time.  
**Fix:**
- Add a `bountyId?: string` prop to `AgentTracker`
- Inside `AgentTracker`, if `bountyId` is provided, subscribe to `agent_logs` via Supabase Realtime (`postgres_changes` INSERT filter on `bounty_id=eq.{bountyId}`)
- Merge incoming Realtime rows with the prop-passed `logs` (deduplicate by `id`)
- This makes the tracker update live during the 30-second Perplexity dispatch without needing the parent to do anything

---

## 🟡 P2 — After P1 Is Done

### 5. Error Recovery UI

**File:** `src/app/page.tsx`  
**Problem:** If Perplexity returns non-JSON (rate limit HTML, hallucinated markdown), the UI shows a generic "AGENT DISPATCH FAILED" error box.  
**Fix:**
- In `handleDispatch`, catch the raw response text before JSON parsing
- If JSON parse fails, store `rawAgentOutput` in state
- In the error state UI, add an expandable "RAW AGENT OUTPUT" section showing the raw text
- This helps debug Perplexity API issues without needing to check server logs

### 6. Hunting Page Node Map

**File:** `src/app/hunting/page.tsx`  
**Problem:** Active Targets panel shows a simple list. The original design had a node graph.  
**Fix:**
- Parse `agent_logs.metadata` for `smokingGunUrl`, `developerHandle`, `keptFiles`
- Render nodes as positioned `<div>` elements with connecting SVG lines
- Node types: BOUNTY (green), CANDIDATE (amber), REPO (gray)
- Use `metadata.smokingGunUrl` to extract repo name for the node label

### 7. Multi-Bounty Dashboard

**File:** `src/app/page.tsx` (Session Map left panel)  
**Problem:** Session Map shows a list but clicking a session doesn't load it.  
**Fix:**
- Clicking a session card in the Session Map should load that bounty's vendor + forensic report
- Fetch `vendors` and `engineer_reports` for the selected `bountyId`
- Restore the full Architect view state (vendor card, forensic dashboard if report exists)

---

## Known Bugs to Watch For

1. **Perplexity returns repo URL instead of PR URL** — `github.ts` now handles this (fetches latest commit), but the forensic score will be lower quality since a repo's latest commit is rarely a "smoking gun" PR. The real fix is to improve the Perplexity prompt to always return a specific PR URL. See `src/lib/perplexity.ts` → `hydrateBrockmanPrompt()`.

2. **Supabase Realtime requires `supabase_realtime` publication** — if `agent_logs` isn't in the realtime publication, the channel subscription will silently receive nothing. Check Supabase dashboard → Database → Replication → `supabase_realtime` publication includes `agent_logs` and `bounties`.

3. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` RLS** — the browser client uses the anon key. If RLS is enabled on `bounties`, `vendors`, `agent_logs`, or `engineer_reports` without a permissive policy, reads will return empty arrays silently. The service role key is only available server-side (API routes). Check that anon SELECT is allowed on these tables.

---

## File Map (Quick Reference)

| What you want to change | File |
|---|---|
| Perplexity hunting prompt | `src/lib/perplexity.ts` → `hydrateBrockmanPrompt()` |
| GitHub diff fetching | `src/lib/github.ts` → `fetchGitHubDiff()` |
| Claude forensic scoring rubric | `src/lib/forensic-scorer.ts` → `scoreForensicDiff()` |
| Bounty creation API | `src/app/api/bounty/route.ts` |
| Agent dispatch API | `src/app/api/bounty/[id]/dispatch/route.ts` |
| Forensic diligence API | `src/app/api/bounty/[id]/diligence/route.ts` |
| Architect page (main flow) | `src/app/page.tsx` |
| Hunting page | `src/app/hunting/page.tsx` |
| Audit page | `src/app/audit/page.tsx` |
| Diligence page | `src/app/diligence/page.tsx` |
| Sidebar nav | `src/components/layout/Sidebar.tsx` |
| Agent phase tracker | `src/components/tracker/AgentTracker.tsx` |
| Vendor quote card | `src/components/settlement/QuoteCard.tsx` |
| Forensic score dashboard | `src/components/forensic/ForensicDashboard.tsx` |
| Supabase schema | `supabase/schema.sql` |
| TypeScript types | `src/types/index.ts` |

---

## How to Start

```bash
# 1. Check current state
git log --oneline -5
git status

# 2. Start dev server if not running
npm run dev

# 3. Read report.md for live vs mock status
# 4. Start with P1 item #1: Audit diff viewer
```
