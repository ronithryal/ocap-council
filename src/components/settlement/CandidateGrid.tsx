'use client';

import { motion } from 'framer-motion';

export interface AlternativeCandidate {
  id: string;
  name: string;
  credentials: string;
  githubUrl?: string | null;
  summary: string;
  quoteAmount?: number;
}

interface CandidateGridProps {
  candidates: AlternativeCandidate[];
  onSelect: (candidate: AlternativeCandidate) => void;
}

export function CandidateGrid({ candidates, onSelect }: CandidateGridProps) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="bg-[#191c22] border border-[#1a1f26]/60 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 bg-[#feb700]/10 border border-[#feb700]/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[#feb700] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            group
          </span>
        </div>
        <div>
          <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px] uppercase">
            Council Shortlist — {candidates.length} Alternative{candidates.length !== 1 ? 's' : ''}
          </div>
          <div className="font-mono text-[9px] text-[#84967e]">
            Select a candidate to run forensic analysis
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {candidates.map((candidate, i) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#10131a] border border-[#1a1f26]/60 p-4 flex flex-col gap-2 hover:border-[#feb700]/30 transition-colors group cursor-pointer"
            onClick={() => onSelect(candidate)}
          >
            {/* Name + archetype */}
            <div className="flex items-start justify-between gap-2">
              <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[12px] truncate">
                {candidate.name}
              </div>
              <span className="font-mono text-[7px] bg-[#feb700]/15 text-[#feb700] px-1.5 py-0.5 flex-shrink-0 uppercase tracking-widest">
                ALT
              </span>
            </div>

            {/* Credentials badge */}
            {candidate.credentials && (
              <div className="font-mono text-[9px] text-[#84967e] truncate">
                {candidate.credentials}
              </div>
            )}

            {/* Smoking gun URL */}
            {candidate.githubUrl && (
              <div className="flex items-center gap-1 min-w-0">
                <span className="material-symbols-outlined text-[10px] text-[#3b4b37] flex-shrink-0">link</span>
                <a
                  href={candidate.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[8px] text-[#00ff41]/70 truncate hover:text-[#00ff41] hover:underline transition-colors"
                >
                  {candidate.githubUrl.replace('https://github.com/', '')}
                </a>
              </div>
            )}

            {/* Summary snippet */}
            {candidate.summary && (
              <p className="font-mono text-[9px] text-[#84967e] leading-relaxed line-clamp-2">
                {candidate.summary}
              </p>
            )}

            {/* CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(candidate);
              }}
              className="mt-auto w-full py-1.5 bg-[#feb700]/10 border border-[#feb700]/20 text-[#feb700] font-['Space_Grotesk'] font-bold text-[9px] uppercase tracking-widest hover:bg-[#feb700]/20 hover:border-[#feb700]/40 transition-colors group-hover:border-[#feb700]/40"
              style={{ borderRadius: '0px' }}
            >
              RUN FORENSIC ANALYSIS
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
