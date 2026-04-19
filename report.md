# OCAP Council — Live vs. Hardcoded Report

> **Generated:** April 19, 2026  
> **Scope:** All UI pages and key components

---

## Summary

| View / Component | Live Data | Hardcoded / Mock |
|---|---|---|
| Architect (`/`) | Vendor, bountyId, forensicReport, logs, phase | Sessions list, all telemetry scores |
| Hunting (`/hunting`) | — | Everything |
| Audit (`/audit`) | Engineer reports list (Supabase) | Diff viewer content, grit markers, AI slop flag |
| Diligence (`/diligence`) | — | Everything |
| AgentTracker | Phase + logs (passed as props from live API) | Phase label copy, step definitions |
| HydrationChat | User's typed prompt | All AI questions (hardcoded array) |
| QuoteCard | Vendor name, credentials, quoteAmount, githubUrl | "Hire Candidate" button is UI-only (no API call) |
| ForensicDashboard | Full ForensicScore from Claude (gritScore, archetype, dimensions, markers, recommendation) | — |

---

## Page-by-Page Breakdown

---

### `/` — Architect Page (`src/app/page.tsx`)

#### ✅ LIVE
| Data | Source |
|---|---|
| `bountyId` | `POST /api/bounty` → Supabase UUID |
| `vendor.id` | `POST /api/bounty/[id]/dispatch` → real `vendors` table UUID |
| `vendor.name`, `.credentials`, `.quoteAmount`, `.githubUrl`, `.summary`, `.isVerified` | Perplexity `v1/agent` response, parsed by `parseVendorFromResponse` |
| `forensicReport` (gritScore, archetype, dimensions, markers, recommendation) | `POST /api/bounty/[id]/diligence` → Claude 3.5 Sonnet scoring |
| `logs[]` | Appended dynamically during dispatch and forensic flows with real API messages |
| `phase` | Computed from real API call lifecycle (idle → dispatching → navigating → quote_received → vetting → failed) |
| `initialPrompt` | User's typed input from BountyInput |

#### ❌ HARDCODED / MOCK
| Data | Value | Location |
|---|---|---|
| `sessions` array | `[{ title: 'Data Pipeline Req', status: 'COMPLETE' }, { title: 'Distributed State', status: 'ACTIVE' }]` | `useState` static init |
| `telemetry.finalPromptBuild` | `42` | `useState` static init |
| `telemetry.estCompletion` | `'2_ITERATIONS'` | `useState` static init |
| `telemetry.clarity` | `0.65` | `useState` static init |
| `telemetry.constraint` | `0.92` | `useState` static init |
| `telemetry.ambiguity` | `0.31` | `useState` static init |
| Context Depth bar | `84%` | Hardcoded inline |
| Target Artifact code block | `type HuntingPrompt = { role: "System Architect", ... }` | Hardcoded JSX |
| Tab bar active state | Always "Hydration" tab active | No routing logic |

---

### `/hunting` — Hunting Page (`src/app/hunting/page.tsx`)

#### ✅ LIVE
_Nothing. This page is entirely mock._

#### ❌ HARDCODED / MOCK
| Data | Value |
|---|---|
| `MOCK_LOGS` array | 5 hardcoded log entries (WARN, HIT, INFO, INFO, AI_SLOP_FLAG) |
| Progress bar | `87.4%` hardcoded |
| Engine Health | `OPTIMAL_99.9V` hardcoded |
| Request Density | `45,210_REQ/S` hardcoded |
| Findings Count | `1,492_SIGNATURES` hardcoded |
| Node map | 3 static `<div>` nodes at fixed positions |
| Source breakdown | GITHUB_API 64%, KAGGLE_DB 22%, HUGGINGFACE 14% — all hardcoded |
| Auto-scroll toggle | Works (UI state only, no data effect) |

---

### `/audit` — Audit Page (`src/app/audit/page.tsx`)

#### ✅ LIVE
| Data | Source |
|---|---|
| `reports[]` — engineer report list in left panel | `SELECT * FROM engineer_reports ORDER BY created_at DESC LIMIT 50` via Supabase browser client |
| `activeReport.developer_handle`, `.grit_score`, `.archetype`, `.recommendation`, `.justification`, `.red_flags` | From selected Supabase `engineer_reports` row |
| Top bar: `TARGET_REPO`, `COMPLEXITY_SCORE`, recommendation badge | Derived from selected live report |

#### ❌ HARDCODED / MOCK
| Data | Value |
|---|---|
| `MOCK_DIFF` — entire diff viewer content | Hardcoded Rust `processor.rs` diff (14 removed, 32 added lines) |
| `GRIT_MARKERS` — left panel when no reports | 2 hardcoded markers (MANUAL MEMORY MGMT, EDGE CASE DENSITY) |
| `AI_SLOP_FLAG` — right panel | Hardcoded BOILERPLATE_DETECTED flag, line 111, 94% confidence |
| Audit verdict progress bar | `78% COMPLETE` hardcoded |
| Diff viewer | Always shows the same mock Rust diff regardless of which report is selected |

> **Note:** The left panel correctly loads real reports from Supabase. But clicking a report does NOT update the diff viewer — it only updates the top bar metadata. The diff viewer is always the mock Rust file.

---

### `/diligence` — Diligence Page (`src/app/diligence/page.tsx`)

#### ✅ LIVE
_Nothing. This page is entirely mock._

#### ❌ HARDCODED / MOCK
| Data | Value |
|---|---|
| `MOCK_REPORT.gritScore` | `96.8` |
| `MOCK_REPORT.percentile` | `'UPPER_PERCENTILE'` |
| `MOCK_REPORT.recommendation` | `'HIRE'` |
| `MOCK_REPORT.hash` | `'0x8F92A...B41C'` |
| `MOCK_REPORT.runtime` | `'0.44s'` |
| `MOCK_REPORT.targetId` | `'994.X2'` |
| Competencies grid | 4 hardcoded entries (ARCHITECTURE A+, EDGE CASES A-, STATEFULNESS B+, EXECUTION VOL. S) |
| Evidence list | 5 hardcoded evidence items |
| Terminal log | 4 hardcoded log lines |

---

### `AgentTracker` (`src/components/tracker/AgentTracker.tsx`)

#### ✅ LIVE
| Data | Source |
|---|---|
| `currentPhase` | Passed as prop from `page.tsx` — reflects real API lifecycle |
| `logs[]` | Passed as prop — real messages from dispatch and diligence API responses |

#### ❌ HARDCODED / MOCK
| Data | Value |
|---|---|
| Phase step definitions | Hardcoded array of phase names, labels, and descriptions |
| Phase completion logic | Derived from `currentPhase` prop (correct, but the step copy is static) |

---

### `HydrationChat` (`src/components/bounty/HydrationChat.tsx`)

#### ✅ LIVE
| Data | Source |
|---|---|
| `initialPrompt` | User's typed input passed as prop |
| Final hydrated prompt | Assembled from user's answers to questions |

#### ❌ HARDCODED / MOCK
| Data | Value |
|---|---|
| Question array | Hardcoded list of clarifying questions (e.g., "What tech stack?", "What's the timeline?") |
| Question flow logic | Static sequential array — not dynamically generated by an AI |

> **Note:** The hydration questions are not generated by the Perplexity agent or any LLM. They are a fixed array. A future improvement would be to call `/api/bounty/analyze` to generate context-aware follow-up questions.

---

### `QuoteCard` (`src/components/settlement/QuoteCard.tsx`)

#### ✅ LIVE
| Data | Source |
|---|---|
| `vendor.name`, `.credentials`, `.quoteAmount`, `.githubUrl`, `.summary`, `.isVerified` | Passed as prop from `page.tsx` — real Perplexity output |

#### ❌ HARDCODED / MOCK
| Data | Value |
|---|---|
| "Hire Candidate" button action | Calls `onSettled()` prop which sets `isSettled: true` in UI state only — no API call, no DB write |
| Quote currency label | Hardcoded "USD" |

---

### `ForensicDashboard` (`src/components/forensic/ForensicDashboard.tsx`)

#### ✅ LIVE
| Data | Source |
|---|---|
| `report.gritScore` | From Claude 3.5 Sonnet scoring via `/api/bounty/[id]/diligence` |
| `report.archetype` | From Claude scoring |
| `report.dimensions` | From Claude scoring (radar chart data) |
| `report.gritMarkers` | From Claude scoring |
| `report.redFlags` | From Claude scoring |
| `report.recommendation` | From Claude scoring (HIRE / DO_NOT_HIRE / NEEDS_REVIEW) |
| `developerHandle`, `smokingGunUrl` | Passed from vendor data (Perplexity output) |

#### ❌ HARDCODED / MOCK
_Minimal. This component is fully data-driven from props. The only hardcoded elements are UI labels and thresholds (e.g., score color breakpoints)._

---

## Backend API Status

| Endpoint | Status | Notes |
|---|---|---|
| `POST /api/bounty` | ✅ Live | Creates bounty in Supabase |
| `POST /api/bounty/[id]/dispatch` | ✅ Live | Calls Perplexity `v1/agent`, inserts vendor to DB |
| `POST /api/bounty/[id]/diligence` | ✅ Live | Fetches GitHub diff, calls Claude, inserts `engineer_reports` |
| `GET /api/bounty/[id]/status` | ✅ Live | Returns bounty phase from Supabase |
| `POST /api/bounty/analyze` | ✅ Live | Used for prompt analysis (not yet wired to telemetry panel) |
| `POST /api/webhook/perplexity` | ✅ Live | Webhook receiver (not actively used in current flow) |

---

## Priority Gaps (What to Wire Next)

1. **Hunting page** — 100% mock. Should subscribe to `agent_logs` via Supabase Realtime for the active bounty.
2. **Diligence page** — 100% mock. Should accept `?reportId=` and load from `engineer_reports`.
3. **Audit diff viewer** — Left panel loads real reports but the diff viewer ignores the selection. Should fetch the real GitHub diff when a report is selected.
4. **Architect telemetry panel** — All 5 scores are static. Should compute from user input in real-time (or call `/api/bounty/analyze`).
5. **Session Map** — Hardcoded 2 sessions. Should load from `bounties` table filtered by user/session.
6. **HydrationChat questions** — Static array. Could be dynamically generated per bounty description.
7. **Alternative candidates** — Perplexity returns them but the frontend discards them entirely.
