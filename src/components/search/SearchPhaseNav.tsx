'use client';

import { SearchPhase } from '@/types';
import { cn } from '@/lib/utils';

const PHASES: { id: SearchPhase; label: string; num: string }[] = [
  { id: 'brief', label: 'BRIEF', num: '01' },
  { id: 'capability-map', label: 'CAPABILITY MAP', num: '02' },
  { id: 'hunt', label: 'HUNT', num: '03' },
  { id: 'shortlist', label: 'SHORTLIST', num: '04' },
];

interface Props {
  phase: SearchPhase;
  onSelect: (p: SearchPhase) => void;
}

export function SearchPhaseNav({ phase, onSelect }: Props) {
  return (
    <div className="fixed top-11 left-[240px] right-0 h-9 bg-[#0b0e14] border-b border-[#1a1f26]/60 flex items-stretch px-2 z-40">
      {PHASES.map((p) => {
        const isActive = phase === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'flex items-center gap-2 px-4 h-full transition-colors relative',
              isActive
                ? 'text-[#00ff41] border-b-2 border-[#00ff41]'
                : 'text-[#84967e] hover:text-[#b9ccb2]'
            )}
          >
            <span className="font-mono text-[9px] text-[#3b4b37]">{p.num}</span>
            <span className={cn(
              "font-['Space_Grotesk'] text-[10px] uppercase tracking-widest",
              isActive ? 'font-bold' : 'font-medium'
            )}>
              {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
