'use client';

import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  time: string;
  type: 'HIT' | 'WARN' | 'INFO' | 'AI_SLOP_FLAG';
  title: string;
  detail?: string;
}

const MOCK_LOGS: LogEntry[] = [
  { time: '14:02:41.09', type: 'WARN', title: 'Rate limit approaching on api.github.com. Throttling concurrent threads to 45.' },
  { time: '14:02:40.11', type: 'HIT', title: 'Smoking Gun Discovered', detail: 'Found relevant PR in rust-lang/rust: #12345\n> Commit msg matches criteria "unsafe memory leak fix"\n> Author: @jdoe_dev | Confidence: 94%' },
  { time: '14:02:39.88', type: 'INFO', title: 'Scraping Kaggle dataset metadata: user_id: 88912 ...' },
  { time: '14:02:39.45', type: 'INFO', title: 'Evaluating HuggingFace model weights repository ...' },
  { time: '14:02:38.12', type: 'AI_SLOP_FLAG', title: 'Detected generic boilerplate profile description. Confidence 88%. Discarding candidate ID: 99xA1.' },
];

const TYPE_CONFIG = {
  HIT: { color: 'text-[#00ff41]', bg: 'bg-[#00ff41]/5 border-l-2 border-[#00ff41]', label: '[HIT]' },
  WARN: { color: 'text-[#feb700]', bg: 'border-l-2 border-transparent', label: '[WARN]' },
  INFO: { color: 'text-[#84967e]', bg: 'border-l-2 border-transparent', label: '[INFO]' },
  AI_SLOP_FLAG: { color: 'text-[#feb700]', bg: 'border-l-2 border-transparent', label: '[AI_SLOP_FLAG]' },
};

export default function HuntingPage() {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const [autoScroll, setAutoScroll] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Top Bar */}
      <header className="fixed top-0 left-[240px] right-0 h-11 bg-[#0b0e14]/95 backdrop-blur-md border-b border-[#1a1f26]/60 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <span className="font-['Space_Grotesk'] font-bold text-[#00ff41] text-sm">CONSOLE_ALPHA</span>
          <span className="text-[#3b4b37] font-mono text-[10px]">|</span>
          <span className="font-mono text-[#84967e] text-[10px]">NODE_09_ACTIVE</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[14px] text-[#84967e]">search</span>
            <input
              className="bg-[#191c22] border border-[#3b4b37]/40 text-[#84967e] font-mono text-[10px] pl-7 pr-3 py-1.5 w-40 focus:outline-none focus:border-[#00ff41]/40 placeholder:text-[#3b4b37]"
              placeholder="QUERY_DB ..."
              style={{ borderRadius: '0px' }}
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3b4b37]/60 text-[#00ff41] font-['Space_Grotesk'] font-bold text-[10px] uppercase hover:bg-[#00ff41]/5 transition-colors">
            <span className="material-symbols-outlined text-[12px]">code</span>
            DECODE_DIFF
          </button>
        </div>
      </header>

      <main className="ml-[240px] pt-11 min-h-screen flex flex-col">
        {/* Status Bar */}
        <div className="bg-[#10131a] border-b border-[#1a1f26]/60 px-8 py-5">
          <div className="text-[10px] font-mono text-[#84967e] uppercase tracking-widest mb-1">OPERATIONAL STATUS</div>
          <div className="flex items-end justify-between">
            <h1 className="font-['Space_Grotesk'] font-black text-[#e1e2eb] text-3xl tracking-tighter uppercase">HUNTING_PROGRESS</h1>
            <div className="text-right">
              <div className="font-['Space_Grotesk'] font-black text-[#e1e2eb] text-3xl">87.4%</div>
              <div className="text-[9px] font-mono text-[#84967e] uppercase tracking-widest">SECTORS_SCANNED</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-[#1a1f26] w-full">
            <div className="h-full bg-[#00ff41]" style={{ width: '87.4%' }} />
          </div>
          {/* Stats row */}
          <div className="mt-4 flex items-center gap-12">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-[#84967e]" />
              <div>
                <div className="text-[9px] font-mono text-[#84967e] uppercase tracking-widest">ENGINE HEALTH</div>
                <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-sm">OPTIMAL_99.9V</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-[#feb700]" />
              <div>
                <div className="text-[9px] font-mono text-[#84967e] uppercase tracking-widest">REQUEST DENSITY</div>
                <div className="font-['Space_Grotesk'] font-bold text-[#feb700] text-sm">45,210_REQ/S</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-[#00b4d8]" />
              <div>
                <div className="text-[9px] font-mono text-[#84967e] uppercase tracking-widest">FINDINGS COUNT</div>
                <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-sm">1,492_SIGNATURES</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content: log + node map */}
        <div className="flex flex-1 gap-0">
          {/* Live Interrogation Log */}
          <div className="flex-1 flex flex-col border-r border-[#1a1f26]/60">
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#1a1f26]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-[#84967e]">manage_search</span>
                <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">LIVE INTERROGATION LOG</span>
              </div>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors ${
                  autoScroll
                    ? 'border-[#00ff41]/40 text-[#00ff41] bg-[#00ff41]/5'
                    : 'border-[#3b4b37]/40 text-[#84967e]'
                }`}
              >
                AUTO-SCROLL_{autoScroll ? 'ON' : 'OFF'}
              </button>
            </div>

            <div ref={logRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-1 font-mono text-[11px]">
              {logs.map((entry, i) => {
                const cfg = TYPE_CONFIG[entry.type];
                return (
                  <div key={i} className={`flex gap-4 p-2 ${cfg.bg} group hover:bg-[#1a1f26]/40 transition-colors`}>
                    <span className="text-[#3b4b37] flex-shrink-0 tabular-nums">{entry.time}</span>
                    <span className={`${cfg.color} font-bold flex-shrink-0`}>{cfg.label}</span>
                    <div className="flex-1">
                      <div className={entry.type === 'HIT' ? 'text-[#e1e2eb] font-bold' : 'text-[#b9ccb2]'}>{entry.title}</div>
                      {entry.detail && (
                        <div className="mt-1.5 bg-[#10131a] border border-[#3b4b37]/30 p-2 text-[#84967e] whitespace-pre-line text-[10px]">
                          {entry.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Blinking cursor */}
              <div className="flex gap-4 p-2">
                <span className="text-[#3b4b37] tabular-nums">—</span>
                <span className="text-[#00ff41] animate-pulse">█</span>
              </div>
            </div>
          </div>

          {/* Right: Node Map + Source Stats */}
          <div className="w-[280px] flex flex-col">
            <div className="px-5 py-3 border-b border-[#1a1f26]/40">
              <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">ACTIVE TARGETS NODE MAP</span>
            </div>
            {/* Node map canvas */}
            <div className="relative bg-[#10131a] border-b border-[#1a1f26]/40" style={{ height: '200px' }}>
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
              {/* Nodes */}
              <div className="absolute top-[30%] left-[40%] h-2 w-2 bg-[#e1e2eb]" />
              <div className="absolute top-[55%] left-[65%] h-2 w-2 bg-[#feb700]" />
              <div className="absolute top-[70%] left-[50%] h-2 w-2 bg-[#84967e]" />
              {/* Connector line */}
              <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                <line x1="40%" y1="30%" x2="65%" y2="55%" stroke="#3b4b37" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
              <div className="absolute bottom-2 right-2 font-mono text-[8px] text-[#3b4b37] uppercase">MAP_RENDER_ACTIVE</div>
            </div>

            {/* Source breakdown */}
            <div className="flex-1 px-5 py-4 space-y-4">
              {[
                { label: 'GITHUB_API', pct: 64, color: '#00ff41' },
                { label: 'KAGGLE_DB', pct: 22, color: '#feb700' },
                { label: 'HUGGINGFACE', pct: 14, color: '#feb700' },
              ].map((src) => (
                <div key={src.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">{src.label}</span>
                    <span className="font-mono text-[10px]" style={{ color: src.color }}>{src.pct}%</span>
                  </div>
                  <div className="h-1 bg-[#1a1f26]">
                    <div className="h-full transition-all" style={{ width: `${src.pct}%`, backgroundColor: src.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
