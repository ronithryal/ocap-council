'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const MOCK_REPORT = {
  gritScore: 96.8,
  percentile: 'UPPER_PERCENTILE',
  target: 85.0,
  recommendation: 'HIRE',
  hash: '0x8F92A...B41C',
  runtime: '0.44s',
  targetId: '994.X2',
  competencies: [
    { label: 'ARCHITECTURE', grade: 'A+', sub: 'Sys Design: EXCEEDS', color: '#00ff41' },
    { label: 'EDGE CASES', grade: 'A-', sub: 'Fault Tol: VERIFIED', color: '#00ff41' },
    { label: 'STATEFULNESS', grade: 'B+', sub: 'Cache Logic: REVIEW', color: '#feb700' },
    { label: 'EXECUTION VOL.', grade: 'S', sub: 'PR Velocity: TOP 1%', color: '#00ff41' },
  ],
  evidence: [
    { id: 'REQ-992.A', title: 'Auth Service Refactor', meta: 'LOC: +420 / -180 | COMPL: O(1)', type: 'link', flag: null },
    { id: 'LOG-104.C', title: 'Concurrency Stress Test', meta: 'PASS: 10k req/s | MEM: STABLE', type: 'link', flag: null },
    { id: 'AUDIT-44.B', title: 'State Mutability Flag', meta: 'MANUAL_REVIEW_REQUIRED', type: 'warn', flag: 'warn' },
    { id: 'PR-881.X', title: 'Database Index Optimiz...', meta: 'LATENCY: -40ms P99', type: 'link', flag: null },
    { id: 'SYS-22.Y', title: 'Legacy Cleanup', meta: 'ROUTINE_MAINTENANCE', type: 'link', flag: null },
  ],
  terminalLog: [
    '> INGESTING METRICS_STREAM...',
    '> VALIDATING COMMIT_HISTORY [OK]',
    '> CROSS_REFERENCING PEER_REVIEWS [OK]',
    '> COMPILED_PROFILE: READY. AWAITING EXECUTIVE DECISION.',
  ],
};

export default function DiligencePage() {
  const [report] = useState(MOCK_REPORT);

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Top Bar */}
      <header className="fixed top-0 left-[240px] right-0 h-11 bg-[#0b0e14]/95 backdrop-blur-md border-b border-[#1a1f26]/60 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <span className="font-['Space_Grotesk'] font-bold text-[#00ff41] text-sm">CONSOLE_ALPHA</span>
          <span className="text-[#3b4b37] font-mono text-[10px]">||</span>
          <span className="font-mono text-[#84967e] text-[10px]">TARGET_ID: {report.targetId}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="font-mono text-[10px] text-[#84967e]">{'> QUERY_'}</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3b4b37]/60 text-[#00ff41] font-['Space_Grotesk'] font-bold text-[10px] uppercase hover:bg-[#00ff41]/5 transition-colors">
            DECODE_DIFF
          </button>
        </div>
      </header>

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
                HASH: {report.hash} | RUNTIME: {report.runtime}
              </div>
            </div>
            {/* Recommendation box */}
            <div className="border border-[#00ff41]/60 bg-[#00ff41]/5 px-6 py-4 min-w-[280px]">
              <div className="font-mono text-[9px] text-[#84967e] uppercase tracking-widest mb-1">VERDICT_LOGIC</div>
              <div className="font-['Space_Grotesk'] font-black text-[#00ff41] text-2xl uppercase tracking-tight">
                RECOMMENDATION: {report.recommendation}
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
                {Math.floor(report.gritScore)}
                <span className="text-3xl text-[#84967e]">.{String(report.gritScore).split('.')[1] || '0'}</span>
              </div>
              <div className="mt-4 bg-[#00ff41]/10 border border-[#00ff41]/30 px-3 py-1">
                <span className="font-mono text-[10px] text-[#00ff41]">{'> '}{report.percentile}</span>
              </div>
            </div>
            {/* Score bar */}
            <div className="mt-6">
              <div className="flex justify-between font-mono text-[9px] text-[#84967e] mb-1.5">
                <span>0.0</span>
                <span>TARGET: {report.target}</span>
                <span>100.0</span>
              </div>
              <div className="h-1.5 bg-[#1a1f26] relative">
                <div className="h-full bg-[#00ff41]" style={{ width: `${report.gritScore}%` }} />
                {/* Target marker */}
                <div className="absolute top-0 bottom-0 w-px bg-[#84967e]/60" style={{ left: `${report.target}%` }} />
              </div>
            </div>
          </div>

          {/* Col 2: Core Competencies */}
          <div className="bg-[#10131a] border border-[#1a1f26]/60 p-6">
            <div className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e] mb-4 flex items-center justify-between">
              CORE_COMPETENCIES
              <span className="material-symbols-outlined text-[14px] text-[#3b4b37]">grid_view</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {report.competencies.map((c) => (
                <div key={c.label} className="bg-[#0b0e14] border border-[#1a1f26]/60 p-3">
                  <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-2">{c.label}</div>
                  <div className="font-['Space_Grotesk'] font-black text-[#e1e2eb] text-2xl">{c.grade}</div>
                  <div className="h-px mt-2 mb-2" style={{ backgroundColor: c.color }} />
                  <div className="font-mono text-[9px]" style={{ color: c.color }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: Traceable Evidence */}
          <div className="bg-[#10131a] border border-[#1a1f26]/60 p-6">
            <div className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e] mb-4 flex items-center justify-between">
              TRACEABLE_EVIDENCE
              <span className="material-symbols-outlined text-[14px] text-[#3b4b37]">storage</span>
            </div>
            <div className="space-y-2">
              {report.evidence.map((ev) => (
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
                        {ev.flag === 'warn' && (
                          <span className="font-mono text-[8px] bg-[#feb700] text-[#0b0e14] px-1 font-bold">AUDIT-44.B</span>
                        )}
                        {ev.flag !== 'warn' && (
                          <span className="font-mono text-[9px] text-[#84967e]">[{ev.id}]</span>
                        )}
                      </div>
                      <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px] truncate">{ev.title}</div>
                      <div className={`font-mono text-[9px] mt-0.5 ${ev.flag === 'warn' ? 'text-[#feb700]' : 'text-[#84967e]'}`}>{ev.meta}</div>
                    </div>
                    {ev.type === 'link' && (
                      <span className="material-symbols-outlined text-[14px] text-[#3b4b37] group-hover:text-[#00ff41] flex-shrink-0 transition-colors">link</span>
                    )}
                    {ev.flag === 'warn' && (
                      <span className="material-symbols-outlined text-[14px] text-[#feb700] flex-shrink-0">warning</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal log */}
        <div className="bg-[#0b0e14] border border-[#1a1f26]/60 p-5">
          <div className="space-y-1">
            {report.terminalLog.map((line, i) => (
              <div key={i} className={`font-mono text-[11px] ${i === report.terminalLog.length - 1 ? 'text-[#00ff41]' : 'text-[#84967e]'}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
