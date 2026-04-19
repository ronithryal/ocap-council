'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveReport {
  id: string;
  bounty_id: string;
  developer_handle: string;
  smoking_gun_url: string | null;
  grit_score: number;
  archetype: string | null;
  recommendation: string | null;
  justification: string | null;
  dimensions: Record<string, number> | null;
  grit_markers: string[] | null;
  red_flags: string[] | null;
  created_at: string;
}

interface AgentLog {
  id: string;
  phase: string;
  message: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToGrade(score: number): string {
  if (score >= 9.5) return 'S';
  if (score >= 8.5) return 'A+';
  if (score >= 7.5) return 'A';
  if (score >= 6.5) return 'A-';
  if (score >= 5.5) return 'B+';
  if (score >= 4.5) return 'B';
  if (score >= 3.5) return 'B-';
  if (score >= 2.5) return 'C+';
  if (score >= 1.5) return 'C';
  return 'D';
}

function gradeColor(grade: string): string {
  if (grade === 'S' || grade.startsWith('A')) return '#00ff41';
  if (grade.startsWith('B')) return '#feb700';
  return '#ffb4ab';
}

function dimensionLabel(key: string): string {
  const map: Record<string, string> = {
    edgeCaseDensity: 'EDGE CASES',
    architecturalIntent: 'ARCHITECTURE',
    codeFingerprint: 'CODE FINGERPRINT',
    testingRigor: 'TESTING RIGOR',
  };
  return map[key] || key.toUpperCase();
}

function dimensionSub(key: string, score: number): string {
  const map: Record<string, string[]> = {
    edgeCaseDensity: ['Fault Tol: WEAK', 'Fault Tol: REVIEW', 'Fault Tol: VERIFIED'],
    architecturalIntent: ['Sys Design: WEAK', 'Sys Design: REVIEW', 'Sys Design: EXCEEDS'],
    codeFingerprint: ['Fingerprint: GENERIC', 'Fingerprint: MIXED', 'Fingerprint: UNIQUE'],
    testingRigor: ['Tests: ABSENT', 'Tests: PARTIAL', 'Tests: RIGOROUS'],
  };
  const arr = map[key] || ['LOW', 'MID', 'HIGH'];
  const idx = score >= 7 ? 2 : score >= 4 ? 1 : 0;
  return arr[idx];
}

function percentileBand(score: number): string {
  if (score >= 85) return 'UPPER_PERCENTILE';
  if (score >= 50) return 'MID_PERCENTILE';
  return 'LOWER_PERCENTILE';
}

function verdictBorderColor(rec: string | null): string {
  if (rec === 'HIRE') return 'border-[#00ff41]/60 bg-[#00ff41]/5';
  if (rec === 'DO_NOT_HIRE') return 'border-[#93000a]/60 bg-[#93000a]/5';
  return 'border-[#feb700]/40 bg-[#feb700]/5';
}

function verdictTextColor(rec: string | null): string {
  if (rec === 'HIRE') return 'text-[#00ff41]';
  if (rec === 'DO_NOT_HIRE') return 'text-[#ffb4ab]';
  return 'text-[#feb700]';
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function DiligenceContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId');

  const [report, setReport] = useState<LiveReport | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.from('engineer_reports').select('*');

        if (reportId) {
          query = query.eq('id', reportId);
        } else {
          query = query.order('created_at', { ascending: false }).limit(1);
        }

        const { data, error: fetchErr } = await query.single();
        if (fetchErr) throw fetchErr;
        setReport(data);

        // Fetch agent logs for this bounty
        if (data?.bounty_id) {
          const { data: logs } = await supabase
            .from('agent_logs')
            .select('id, phase, message, created_at')
            .eq('bounty_id', data.bounty_id)
            .order('created_at', { ascending: true })
            .limit(20);
          setAgentLogs(logs || []);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [reportId]);

  // ── Derived display values ──────────────────────────────────────────────────

  const gritScore = report?.grit_score ?? 0;
  const gritWhole = Math.floor(gritScore);
  const gritDecimal = String(gritScore).includes('.') ? String(gritScore).split('.')[1] : '0';
  const percentile = percentileBand(gritScore);
  const rec = report?.recommendation ?? null;

  const dimensions = report?.dimensions ?? {};
  const competencies = Object.entries(dimensions).map(([key, val]) => {
    const grade = scoreToGrade(val);
    return {
      label: dimensionLabel(key),
      grade,
      sub: dimensionSub(key, val),
      color: gradeColor(grade),
    };
  });

  // Evidence: grit_markers (positive) + red_flags (warn)
  const evidence = [
    ...(report?.grit_markers ?? []).map((m, i) => ({
      id: `GM-${i + 1}`,
      title: m.length > 50 ? m.substring(0, 50) + '...' : m,
      meta: m,
      flag: null as null | 'warn',
    })),
    ...(report?.red_flags ?? []).map((f, i) => ({
      id: `RF-${i + 1}`,
      title: f.length > 50 ? f.substring(0, 50) + '...' : f,
      meta: 'MANUAL_REVIEW_REQUIRED',
      flag: 'warn' as const,
    })),
  ];

  // Terminal log: justification + agent logs
  const terminalLines: string[] = [
    '> INGESTING METRICS_STREAM...',
    '> VALIDATING COMMIT_HISTORY [OK]',
    ...agentLogs.map((l) => `> [${l.phase.toUpperCase()}] ${l.message}`),
    ...(report?.justification ? [`> JUSTIFICATION: ${report.justification}`] : []),
    '> COMPILED_PROFILE: READY. AWAITING EXECUTIVE DECISION.',
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="ml-[240px] pt-11 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[#00ff41] animate-spin text-[32px]">progress_activity</span>
          <span className="font-mono text-[10px] text-[#84967e]">LOADING_DILIGENCE_REPORT...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="ml-[240px] pt-11 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 p-8 border border-[#ffb4ab]/20 bg-[#93000a]/5 max-w-sm text-center">
          <span className="material-symbols-outlined text-[#ffb4ab] text-[32px]">error</span>
          <div className="font-['Space_Grotesk'] font-bold text-[#ffb4ab] text-[11px] uppercase">
            {error ? 'REPORT_LOAD_FAILED' : 'NO_REPORT_FOUND'}
          </div>
          {error && <p className="font-mono text-[9px] text-[#84967e]">{error}</p>}
          {!error && (
            <p className="font-mono text-[9px] text-[#84967e]">
              No forensic reports exist yet. Run a diligence analysis from the Architect page.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="ml-[240px] pt-11 p-8 min-h-screen">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 bg-[#00ff41]" />
          <span className="font-mono text-[9px] text-[#84967e] uppercase tracking-widest">STATUS: ANALYSIS_COMPLETE</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-['Space_Grotesk'] font-black text-[#e1e2eb]/30 text-4xl uppercase tracking-tighter">DILIGENCE REPORT</h1>
            <div className="font-mono text-[10px] text-[#84967e] mt-1">
              TARGET: {report.developer_handle} | ID: {report.id.substring(0, 8).toUpperCase()}
            </div>
          </div>
          {/* Recommendation box */}
          <div className={`border px-6 py-4 min-w-[280px] ${verdictBorderColor(rec)}`}>
            <div className="font-mono text-[9px] text-[#84967e] uppercase tracking-widest mb-1">VERDICT_LOGIC</div>
            <div className={`font-['Space_Grotesk'] font-black text-2xl uppercase tracking-tight ${verdictTextColor(rec)}`}>
              RECOMMENDATION: {rec || 'PENDING'}
            </div>
          </div>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Col 1: Grit Score */}
        <div className="bg-[#10131a] border border-[#1a1f26]/60 p-6 flex flex-col">
          <div className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e] mb-4 flex items-center justify-between">
            GRIT_SCORE
            <span className="material-symbols-outlined text-[14px] text-[#3b4b37]">settings</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="font-['Space_Grotesk'] font-black text-[#e1e2eb] leading-none" style={{ fontSize: '5rem' }}>
              {gritWhole}
              <span className="text-3xl text-[#84967e]">.{gritDecimal}</span>
            </div>
            <div className="mt-4 bg-[#00ff41]/10 border border-[#00ff41]/30 px-3 py-1">
              <span className="font-mono text-[10px] text-[#00ff41]">{'> '}{percentile}</span>
            </div>
            {report.archetype && (
              <div className="mt-2 font-mono text-[9px] text-[#84967e] uppercase">{report.archetype}</div>
            )}
          </div>
          {/* Score bar */}
          <div className="mt-6">
            <div className="flex justify-between font-mono text-[9px] text-[#84967e] mb-1.5">
              <span>0.0</span>
              <span>TARGET: 85.0</span>
              <span>100.0</span>
            </div>
            <div className="h-1.5 bg-[#1a1f26] relative">
              <div className="h-full bg-[#00ff41]" style={{ width: `${gritScore}%` }} />
              <div className="absolute top-0 bottom-0 w-px bg-[#84967e]/60" style={{ left: '85%' }} />
            </div>
          </div>
        </div>

        {/* Col 2: Core Competencies */}
        <div className="bg-[#10131a] border border-[#1a1f26]/60 p-6">
          <div className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e] mb-4 flex items-center justify-between">
            CORE_COMPETENCIES
            <span className="material-symbols-outlined text-[14px] text-[#3b4b37]">grid_view</span>
          </div>
          {competencies.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {competencies.map((c) => (
                <div key={c.label} className="bg-[#0b0e14] border border-[#1a1f26]/60 p-3">
                  <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-2">{c.label}</div>
                  <div className="font-['Space_Grotesk'] font-black text-[#e1e2eb] text-2xl">{c.grade}</div>
                  <div className="h-px mt-2 mb-2" style={{ backgroundColor: c.color }} />
                  <div className="font-mono text-[9px]" style={{ color: c.color }}>{c.sub}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-[9px] text-[#3b4b37]">NO_DIMENSION_DATA</div>
          )}
        </div>

        {/* Col 3: Traceable Evidence */}
        <div className="bg-[#10131a] border border-[#1a1f26]/60 p-6">
          <div className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e] mb-4 flex items-center justify-between">
            TRACEABLE_EVIDENCE
            <span className="material-symbols-outlined text-[14px] text-[#3b4b37]">storage</span>
          </div>
          {evidence.length > 0 ? (
            <div className="space-y-2">
              {evidence.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3 border transition-colors group cursor-pointer ${
                    ev.flag === 'warn'
                      ? 'border-[#feb700]/30 bg-[#feb700]/5'
                      : 'border-[#1a1f26]/60 hover:border-[#00ff41]/20 hover:bg-[#00ff41]/3'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {ev.flag === 'warn' ? (
                          <span className="font-mono text-[8px] bg-[#feb700] text-[#0b0e14] px-1 font-bold">{ev.id}</span>
                        ) : (
                          <span className="font-mono text-[9px] text-[#84967e]">[{ev.id}]</span>
                        )}
                      </div>
                      <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px] truncate">{ev.title}</div>
                      <div className={`font-mono text-[9px] mt-0.5 ${ev.flag === 'warn' ? 'text-[#feb700]' : 'text-[#84967e]'}`}>{ev.meta}</div>
                    </div>
                    {ev.flag === 'warn' ? (
                      <span className="material-symbols-outlined text-[14px] text-[#feb700] flex-shrink-0">warning</span>
                    ) : (
                      <span className="material-symbols-outlined text-[14px] text-[#3b4b37] group-hover:text-[#00ff41] flex-shrink-0 transition-colors">link</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-[9px] text-[#3b4b37]">NO_EVIDENCE_DATA</div>
          )}
        </div>
      </div>

      {/* Terminal log */}
      <div className="bg-[#0b0e14] border border-[#1a1f26]/60 p-5">
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {terminalLines.map((line, i) => (
            <div
              key={i}
              className={`font-mono text-[11px] ${
                i === terminalLines.length - 1 ? 'text-[#00ff41]' : 'text-[#84967e]'
              }`}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Page wrapper with Suspense (required for useSearchParams in Next.js 15+) ─

export default function DiligencePage() {
  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Top Bar */}
      <header className="fixed top-0 left-[240px] right-0 h-11 bg-[#0b0e14]/95 backdrop-blur-md border-b border-[#1a1f26]/60 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <span className="font-['Space_Grotesk'] font-bold text-[#00ff41] text-sm">CONSOLE_ALPHA</span>
          <span className="text-[#3b4b37] font-mono text-[10px]">||</span>
          <span className="font-mono text-[#84967e] text-[10px]">DILIGENCE_REPORT</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3b4b37]/60 text-[#00ff41] font-['Space_Grotesk'] font-bold text-[10px] uppercase hover:bg-[#00ff41]/5 transition-colors">
            DECODE_DIFF
          </button>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="ml-[240px] pt-11 flex items-center justify-center min-h-screen">
            <span className="font-mono text-[10px] text-[#3b4b37]">LOADING...</span>
          </div>
        }
      >
        <DiligenceContent />
      </Suspense>
    </div>
  );
}
