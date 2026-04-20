'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface EngineerReport {
  id: string;
  developer_handle: string;
  smoking_gun_url: string | null;
  grit_score: number;
  archetype: string | null;
  recommendation: string | null;
  justification: string | null;
  red_flags: string[] | null;
  grit_markers: string[] | null;
  dimensions: Record<string, number> | null;
  created_at: string;
}

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

interface DiffFile {
  file: string;
  added: number;
  removed: number;
  lines: DiffLine[];
}

const GRIT_MARKERS_MOCK = [
  { type: 'INTENTIONAL', title: 'MANUAL MEMORY MGMT', desc: 'Direct allocation detected outside of safe scope. Developer intent clear.' },
  { type: 'HIGH', title: 'EDGE CASE DENSITY', desc: "Cyclomatic complexity spiked in 'process_stream' function." },
];

const AI_SLOP_FLAG_MOCK = {
  tag: 'BOILERPLATE_DETECTED',
  line: 111,
  title: 'UNSAFE COPY BLOCK',
  desc: 'Pattern matches generic LLM optimization suggestion for Rust zero-copy buffering. Lacks surrounding bounds checking usually present in manual implementations.',
  confidence: 94,
};

// ─── Inner component (uses useSearchParams) ────────────────────────────────────

function AuditContent() {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get('url');       // direct artifact URL
  const reportIdParam = searchParams.get('reportId'); // direct report ID

  const [reports, setReports] = useState<EngineerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EngineerReport | null>(null);

  // Diff state
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  // The URL to fetch diff for — either from ?url= param or from active report
  const [activeDiffUrl, setActiveDiffUrl] = useState<string | null>(urlParam);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase
      .from('engineer_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else {
          const rows = data || [];
          setReports(rows);
          // If reportId param, pre-select that report
          if (reportIdParam) {
            const match = rows.find((r) => r.id === reportIdParam);
            if (match) {
              setSelected(match);
              setActiveDiffUrl(match.smoking_gun_url);
            }
          }
        }
        setLoading(false);
      });
  }, [reportIdParam]);

  // When active report changes (and no explicit ?url=), sync activeDiffUrl
  const activeReport = selected || reports[0] || null;
  useEffect(() => {
    if (!urlParam) {
      setActiveDiffUrl(activeReport?.smoking_gun_url ?? null);
    }
  }, [activeReport?.id, urlParam]);

  // Fetch diff whenever activeDiffUrl changes
  useEffect(() => {
    if (!activeDiffUrl) {
      setDiffFiles([]);
      setDiffError(null);
      return;
    }
    setDiffLoading(true);
    setDiffError(null);
    setDiffFiles([]);
    setActiveFileIdx(0);

    fetch(`/api/bounty/diff?url=${encodeURIComponent(activeDiffUrl)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch diff');
        setDiffFiles(json.files || []);
      })
      .catch((err) => setDiffError(err.message))
      .finally(() => setDiffLoading(false));
  }, [activeDiffUrl]);

  const activeFile = diffFiles[activeFileIdx] ?? null;
  const slopFlags = activeReport?.red_flags ?? [];

  // Display target: prefer ?url= param label, else report handle
  const targetLabel = urlParam
    ? urlParam.replace('https://github.com/', '').split('/').slice(0, 3).join('/')
    : activeReport
    ? `TARGET_REPO: ${activeReport.developer_handle}`
    : 'NO_TARGET_SELECTED';

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Top Bar */}
      <header className="fixed top-0 left-[240px] right-0 h-11 bg-[#0b0e14]/95 backdrop-blur-md border-b border-[#1a1f26]/60 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <span className="font-['Space_Grotesk'] font-bold text-[#00ff41] text-sm">CONSOLE_ALPHA</span>
          <span className="text-[#3b4b37] font-mono text-[10px]">|</span>
          <span className="font-mono text-[#84967e] text-[10px]">{targetLabel}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[#84967e] text-[10px]">
            {activeReport ? `COMPLEXITY_SCORE: ${activeReport.grit_score}/10` : ''}
          </span>
          {activeReport?.recommendation && (
            <span className={`font-['Space_Grotesk'] font-bold text-[10px] px-2 py-1 uppercase ${
              activeReport.recommendation === 'HIRE' ? 'bg-[#00ff41] text-[#003907]' :
              activeReport.recommendation === 'DO_NOT_HIRE' ? 'bg-[#93000a] text-[#ffb4ab]' :
              'bg-[#feb700]/20 text-[#feb700]'
            }`}>
              {activeReport.recommendation === 'HIRE' ? 'FLAGGED' : activeReport.recommendation}
            </span>
          )}
          {/* File tabs for multi-file diffs */}
          {diffFiles.length > 1 && (
            <div className="flex items-center gap-1">
              {diffFiles.slice(0, 4).map((f, i) => (
                <button key={i} onClick={() => setActiveFileIdx(i)}
                  className={`font-mono text-[8px] px-2 py-1 border transition-colors ${
                    i === activeFileIdx
                      ? 'border-[#00ff41]/40 text-[#00ff41] bg-[#00ff41]/5'
                      : 'border-[#3b4b37]/40 text-[#84967e] hover:text-[#b9ccb2]'
                  }`}
                  style={{ borderRadius: '0px' }} title={f.file}>
                  {f.file.split('/').pop()?.substring(0, 16) || f.file.substring(0, 16)}
                </button>
              ))}
              {diffFiles.length > 4 && (
                <span className="font-mono text-[8px] text-[#3b4b37]">+{diffFiles.length - 4} more</span>
              )}
            </div>
          )}
          {activeDiffUrl && (
            <a href={activeDiffUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3b4b37]/60 text-[#00ff41] font-['Space_Grotesk'] font-bold text-[10px] uppercase hover:bg-[#00ff41]/5 transition-colors">
              DECODE_DIFF ↗
            </a>
          )}
        </div>
      </header>

      <div className="ml-[240px] pt-11 flex h-[calc(100vh-44px)]">
        {/* Left: Grit Markers + report list */}
        <div className="w-[220px] flex-shrink-0 border-r border-[#1a1f26]/60 flex flex-col bg-[#0b0e14]">
          <div className="px-4 py-3 border-b border-[#1a1f26]/40">
            <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">GRIT_MARKERS</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {loading && <div className="px-4 py-3 font-mono text-[9px] text-[#84967e]">LOADING_REPORTS...</div>}
            {error && <div className="px-4 py-3 font-mono text-[9px] text-[#ffb4ab]">ERR: {error}</div>}
            {!loading && reports.length === 0 && (
              <>
                {GRIT_MARKERS_MOCK.map((m, i) => (
                  <div key={i} className="mx-2 mb-2 p-3 bg-[#10131a] border border-[#1a1f26]/60">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="material-symbols-outlined text-[12px] text-[#00ff41]">
                        {m.type === 'INTENTIONAL' ? 'settings' : 'warning'}
                      </span>
                      <span className={`font-mono text-[8px] px-1 ${
                        m.type === 'HIGH' ? 'bg-[#feb700] text-[#0b0e14]' : 'bg-[#00ff41]/20 text-[#00ff41]'
                      }`}>{m.type}</span>
                    </div>
                    <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[10px] mb-1">{m.title}</div>
                    <p className="font-mono text-[9px] text-[#84967e] leading-relaxed">{m.desc}</p>
                  </div>
                ))}
              </>
            )}
            {activeReport?.grit_markers && activeReport.grit_markers.length > 0 && (
              <div className="px-2 pb-2">
                <div className="font-mono text-[8px] text-[#3b4b37] uppercase px-1 py-1">GRIT SIGNALS</div>
                {activeReport.grit_markers.map((m, i) => (
                  <div key={i} className="mb-2 p-2 bg-[#10131a] border border-[#00ff41]/10">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#00ff41] text-[10px] flex-shrink-0 mt-0.5">+</span>
                      <span className="font-mono text-[9px] text-[#b9ccb2] leading-relaxed">{m}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Report list */}
            {reports.map((r) => (
              <div key={r.id} onClick={() => { setSelected(r); setActiveDiffUrl(r.smoking_gun_url); }}
                className={`mx-2 mb-1 p-3 border cursor-pointer transition-colors ${
                  (selected?.id || reports[0]?.id) === r.id
                    ? 'border-[#00ff41]/30 bg-[#00ff41]/5'
                    : 'border-[#1a1f26]/40 hover:border-[#3b4b37]/60'
                }`}>
                <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[10px] truncate mb-0.5">{r.developer_handle}</div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] text-[#00ff41]">{r.grit_score}/10</span>
                  <span className="font-mono text-[8px] text-[#84967e]">{r.archetype || '—'}</span>
                </div>
                <div className="font-mono text-[8px] text-[#3b4b37] mt-0.5">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Diff Viewer */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#1a1f26]/60 bg-[#0b0e14]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1f26]/40 bg-[#10131a]">
            <span className="font-mono text-[10px] text-[#84967e] truncate max-w-[60%]">
              {diffLoading ? 'FETCHING_DIFF...'
                : activeFile ? activeFile.file
                : activeDiffUrl ? (diffError ? `ERR: ${diffError.substring(0, 60)}` : 'NO_DIFF_CONTENT')
                : 'NO_TARGET_URL'}
            </span>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              {activeFile && (
                <>
                  <span className="text-[#ffb4ab]">- {activeFile.removed} lines</span>
                  <span className="text-[#00ff41]">+ {activeFile.added} lines</span>
                </>
              )}
              {diffFiles.length > 1 && <span className="text-[#84967e]">{diffFiles.length} files</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px]">
            {diffLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="h-8 w-8 border border-[#00ff41]/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#00ff41] animate-spin text-[18px]">progress_activity</span>
                </div>
                <span className="font-mono text-[10px] text-[#84967e]">FETCHING_DIFF_FROM_GITHUB...</span>
                {activeDiffUrl && (
                  <span className="font-mono text-[9px] text-[#3b4b37] max-w-xs text-center truncate">{activeDiffUrl}</span>
                )}
              </div>
            )}
            {!diffLoading && diffError && (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[32px]">error</span>
                <div className="font-['Space_Grotesk'] font-bold text-[#ffb4ab] text-[11px] uppercase">DIFF_FETCH_FAILED</div>
                <p className="font-mono text-[9px] text-[#84967e] text-center max-w-sm">{diffError}</p>
                {activeDiffUrl && (
                  <a href={activeDiffUrl} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-[9px] text-[#00ff41] hover:underline">VIEW ON GITHUB ↗</a>
                )}
              </div>
            )}
            {!diffLoading && !diffError && !activeDiffUrl && (
              <div className="flex items-center justify-center h-full">
                <span className="font-mono text-[10px] text-[#3b4b37]">NO_TARGET_URL — select a report or pass ?url= param</span>
              </div>
            )}
            {!diffLoading && !diffError && activeDiffUrl && !activeFile && (
              <div className="flex items-center justify-center h-full">
                <span className="font-mono text-[10px] text-[#3b4b37]">NO_DIFF_CONTENT</span>
              </div>
            )}
            {!diffLoading && !diffError && activeFile && activeFile.lines.map((line, i) => (
              <div key={i} className={`flex items-start group relative ${
                line.type === 'remove' ? 'bg-[#93000a]/10 hover:bg-[#93000a]/15'
                  : line.type === 'add' ? 'bg-[#00ff41]/5 hover:bg-[#00ff41]/8'
                  : 'hover:bg-[#1a1f26]/40'
              }`}>
                <div className="flex-shrink-0 w-16 flex select-none">
                  <span className="w-8 text-right pr-2 text-[#3b4b37] py-0.5 text-[10px]">
                    {line.type !== 'add' && line.oldLineNum != null ? line.oldLineNum : ''}
                  </span>
                  <span className="w-8 text-right pr-2 text-[#3b4b37] py-0.5 text-[10px]">
                    {line.type !== 'remove' && line.newLineNum != null ? line.newLineNum : ''}
                  </span>
                </div>
                <div className={`w-4 flex-shrink-0 text-center py-0.5 select-none ${
                  line.type === 'remove' ? 'text-[#ffb4ab]' : line.type === 'add' ? 'text-[#00ff41]' : 'text-[#3b4b37]'
                }`}>
                  {line.type === 'remove' ? '-' : line.type === 'add' ? '+' : ' '}
                </div>
                <div className={`flex-1 py-0.5 pr-4 whitespace-pre overflow-hidden ${
                  line.type === 'remove' ? 'text-[#ffb4ab]/80' : line.type === 'add' ? 'text-[#e1e2eb]' : 'text-[#84967e]'
                }`}>{line.content}</div>
              </div>
            ))}
          </div>

          {/* Audit verdict bar */}
          <div className="border-t border-[#1a1f26]/60 px-4 py-2 bg-[#10131a] flex items-center justify-between">
            <div className="font-mono text-[9px] text-[#84967e] uppercase tracking-widest">{'> AUDIT_VERDICT_'}</div>
            <div className="flex items-center gap-4">
              {activeFile && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-[#84967e]">SCANNING_NODES</span>
                  <div className="w-48 h-1 bg-[#1a1f26]">
                    <div className="h-full bg-[#00ff41]" style={{
                      width: `${Math.min(100, Math.round((activeFile.added / Math.max(1, activeFile.added + activeFile.removed)) * 100))}%`
                    }} />
                  </div>
                  <span className="font-mono text-[9px] text-[#84967e]">{activeFile.lines.length} LINES</span>
                </div>
              )}
              <button className="px-3 py-1.5 border border-[#3b4b37]/60 text-[#84967e] font-['Space_Grotesk'] font-bold text-[9px] uppercase hover:border-[#feb700]/40 hover:text-[#feb700] transition-colors">
                PAUSE_AUDIT
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Slop Flags */}
        <div className="w-[240px] flex-shrink-0 flex flex-col bg-[#0b0e14]">
          <div className="px-4 py-3 border-b border-[#1a1f26]/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#feb700]">smart_toy</span>
              <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">AI_SLOP_FLAGS</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {slopFlags.length > 0 ? (
              <div className="space-y-2 mb-3">
                {slopFlags.map((flag, i) => (
                  <div key={i} className="bg-[#10131a] border border-[#feb700]/30 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-[8px] bg-[#feb700] text-[#0b0e14] px-1 font-bold">AI_SLOP_FLAG</span>
                    </div>
                    <p className="font-mono text-[9px] text-[#84967e] leading-relaxed">{flag}</p>
                  </div>
                ))}
              </div>
            ) : !activeReport ? (
              <div className="bg-[#10131a] border border-[#feb700]/30 p-3 mb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-[8px] bg-[#feb700] text-[#0b0e14] px-1 font-bold">{AI_SLOP_FLAG_MOCK.tag}</span>
                  <span className="font-mono text-[9px] text-[#84967e]">Ln {AI_SLOP_FLAG_MOCK.line}</span>
                </div>
                <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px] mb-2">{AI_SLOP_FLAG_MOCK.title}</div>
                <p className="font-mono text-[9px] text-[#84967e] leading-relaxed mb-3">{AI_SLOP_FLAG_MOCK.desc}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[8px] text-[#84967e] uppercase">CONFIDENCE: </span>
                    <span className="font-mono text-[9px] text-[#feb700]">{AI_SLOP_FLAG_MOCK.confidence}%</span>
                  </div>
                  <button className="font-mono text-[8px] text-[#00ff41] hover:underline uppercase">VIEW_SOURCE ↗</button>
                </div>
              </div>
            ) : (
              <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3 mb-3">
                <span className="font-mono text-[9px] text-[#3b4b37]">NO_SLOP_FLAGS_DETECTED</span>
              </div>
            )}
            {activeReport?.justification && (
              <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3 mb-3">
                <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-2">CTO_JUSTIFICATION</div>
                <p className="font-mono text-[9px] text-[#b9ccb2] leading-relaxed">{activeReport.justification}</p>
              </div>
            )}
            {activeDiffUrl && (
              <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3">
                <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-2">TARGET_URL</div>
                <a href={activeDiffUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[9px] text-[#00ff41] break-all hover:underline">{activeDiffUrl}</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page wrapper with Suspense (required for useSearchParams) ─────────────────

export default function AuditPage() {
  return (
    <Suspense fallback={
      <div className="ml-[240px] pt-11 flex items-center justify-center min-h-screen bg-[#0b0e14]">
        <span className="font-mono text-[10px] text-[#3b4b37]">LOADING_AUDIT...</span>
      </div>
    }>
      <AuditContent />
    </Suspense>
  );
}
