'use client';

import { useState, useRef, useEffect } from 'react';

const PHASE_TAG: Record<string, { label: string; color: string }> = {
  dispatching:    { label: 'INFO',  color: '#84967e' },
  navigating:     { label: 'INFO',  color: '#84967e' },
  vetting:        { label: 'SCAN',  color: '#00ff41' },
  awaiting_quote: { label: 'HIT',   color: '#00ff41' },
  quote_received: { label: 'HIT',   color: '#00ff41' },
  failed:         { label: 'WARN',  color: '#ffb4ab' },
};

function getLogTag(phase: string, message: string) {
  if (message.toLowerCase().includes('slop') || message.toLowerCase().includes('flag'))
    return { label: 'AI_SLOP_FLAG', color: '#feb700' };
  if (message.toLowerCase().includes('fail') || message.toLowerCase().includes('error'))
    return { label: 'WARN', color: '#ffb4ab' };
  return PHASE_TAG[phase] ?? { label: 'INFO', color: '#84967e' };
}

export interface InterrogationLog {
  id?: string | number;
  phase: string;
  message: string;
  created_at: string;
}

export interface LiveInterrogationLogProps {
  bountyId: string | null;
  logs: InterrogationLog[];
}

export function LiveInterrogationLog({ bountyId, logs }: LiveInterrogationLogProps) {
  const [huntAutoScroll, setHuntAutoScroll] = useState(true);
  const huntLogEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (huntAutoScroll && huntLogEndRef.current) {
      huntLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, huntAutoScroll]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-[#1a1f26]/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-[#00ff41] rounded-full animate-pulse" />
          <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">LIVE INTERROGATION LOG</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-[#3b4b37]">{logs.length} ENTRIES</span>
          <button
            onClick={() => setHuntAutoScroll(v => !v)}
            className={`font-mono text-[8px] uppercase tracking-widest px-2 py-1 border transition-colors ${
              huntAutoScroll ? 'border-[#00ff41]/40 text-[#00ff41] bg-[#00ff41]/5' : 'border-[#3b4b37]/40 text-[#84967e]'
            }`}
          >
            AUTOSCROLL {huntAutoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1">
        {logs.length === 0 && (
          <div className="text-[#3b4b37] py-4">{bountyId ? 'NO_LOGS_YET' : 'NO_ACTIVE_SESSION'}</div>
        )}
        {logs.map((log, i) => {
          const tag = getLogTag(log.phase, log.message);
          const ts = new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false });
          return (
            <div key={log.id ?? i} className="flex items-start gap-3 py-0.5">
              <span className="text-[#3b4b37] flex-shrink-0 w-20">{ts}</span>
              <span className="flex-shrink-0 px-1 text-[9px] uppercase tracking-widest w-24 text-center"
                style={{ color: tag.color, backgroundColor: `${tag.color}15` }}>
                {tag.label}
              </span>
              <span className="text-[#b9ccb2] flex-1 leading-relaxed">{log.message}</span>
            </div>
          );
        })}
        <div ref={huntLogEndRef} />
      </div>
      <div className="border-t border-[#1a1f26]/40 px-5 py-2 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[#84967e]">HITS:</span>
          <span className="font-mono text-[9px] text-[#00ff41]">
            {logs.filter(l => l.phase === 'awaiting_quote' || l.phase === 'quote_received').length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[#84967e]">WARNINGS:</span>
          <span className="font-mono text-[9px] text-[#ffb4ab]">
            {logs.filter(l => l.phase === 'failed').length}
          </span>
        </div>
      </div>
    </div>
  );
}
