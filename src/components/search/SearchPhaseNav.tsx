'use client';

import { SearchPhase } from '@/types';

const PHASES: { id: SearchPhase; label: string; num: string }[] = [
  { id: 'brief',          label: 'BRIEF',        num: '01' },
  { id: 'capability-map', label: 'CAPABILITY MAP', num: '02' },
  { id: 'hunt',           label: 'HUNT',         num: '03' },
  { id: 'shortlist',      label: 'SHORTLIST',    num: '04' },
];

interface Props {
  phase: SearchPhase;
}

export function SearchPhaseNav({ phase }: Props) {
  return (
    <div className="fixed top-11 left-[240px] right-0 h-8 bg-[#0b0e14] border-b border-[#1a1f26]/60 flex items-center px-5 gap-0 z-40">
      {PHASES.map((p, i) => {
        const isActive = phase === p.id;
        const isPast = PHASES.findIndex(x => x.id === phase) > i;
        return (
          <div key={p.id} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-[8px] ${isActive ? 'text-[#00ff41]' : isPast ? 'text-[#3b4b37]' : 'text-[#1a1f26]'}`}>
                {p.num}
              </span>
              <span className={`font-['Space_Grotesk'] text-[9px] uppercase tracking-widest transition-colors ${
                isActive ? 'text-[#00ff41] font-bold' : isPast ? 'text-[#3b4b37]' : 'text-[#1a1f26]'
              }`}>
                {p.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <span className={`mx-3 font-mono text-[9px] ${isPast ? 'text-[#3b4b37]' : 'text-[#1a1f26]'}`}>—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
