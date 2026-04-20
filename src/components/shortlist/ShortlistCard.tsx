'use client';

import Link from 'next/link';
import { ShortlistCandidate } from '@/types';

interface Props {
  candidate: ShortlistCandidate;
  isAnalyzing?: boolean;
  onAnalyze?: (candidateId: string) => void;
}

const BUCKET_STYLES: Record<string, { border: string; badge: string; label: string }> = {
  'Archetype':  { border: 'border-[#00ff41]/40', badge: 'bg-[#00ff41]/20 text-[#00ff41]',  label: 'ARCHETYPE' },
  'Solid Fit':  { border: 'border-[#feb700]/30', badge: 'bg-[#feb700]/20 text-[#feb700]',  label: 'SOLID FIT' },
  'Alternative':{ border: 'border-[#1a1f26]/60', badge: 'bg-[#1a1f26]/60 text-[#84967e]',  label: 'ALTERNATIVE' },
};

const REC_STYLES: Record<string, string> = {
  'HIRE':              'bg-[#00ff41] text-[#003907]',
  'NEEDS_HUMAN_REVIEW':'bg-[#feb700]/20 text-[#feb700]',
  'DO_NOT_HIRE':       'bg-[#93000a]/30 text-[#ffb4ab]',
};

function ScorePip({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-mono text-[8px] text-[#84967e] uppercase">{label}</span>
        <span className="font-mono text-[9px]" style={{ color }}>{val.toFixed(1)}</span>
      </div>
      <div className="h-0.5 bg-[#1a1f26]">
        <div className="h-full transition-all" style={{ width: `${(val / 10) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function ShortlistCard({ candidate, isAnalyzing, onAnalyze }: Props) {
  const bs = BUCKET_STYLES[candidate.bucket] ?? BUCKET_STYLES['Alternative'];
  const recStyle = candidate.recommendation ? (REC_STYLES[candidate.recommendation] ?? '') : '';

  const overallColor =
    candidate.huntScore.overall >= 8 ? '#00ff41' :
    candidate.huntScore.overall >= 6 ? '#feb700' : '#84967e';

  return (
    <div className={`bg-[#10131a] border ${bs.border} p-4 flex flex-col gap-3`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`font-mono text-[8px] px-1.5 py-0.5 ${bs.badge}`}>{bs.label}</span>
            {candidate.recommendation && (
              <span className={`font-mono text-[8px] px-1.5 py-0.5 font-bold ${recStyle}`}>
                {candidate.recommendation.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[13px] truncate">
            {candidate.developerHandle}
          </div>
          {candidate.archetype && (
            <div className="font-mono text-[9px] text-[#84967e] mt-0.5">{candidate.archetype}</div>
          )}
        </div>
        {/* Overall score */}
        <div className="flex-shrink-0 text-right">
          <div className="font-['Space_Grotesk'] font-black text-2xl leading-none" style={{ color: overallColor }}>
            {candidate.huntScore.overall.toFixed(1)}
          </div>
          <div className="font-mono text-[8px] text-[#3b4b37] mt-0.5">OVERALL</div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="flex items-end gap-3">
        <ScorePip label="ENG" val={candidate.huntScore.engineerQuality}
          color={candidate.huntScore.engineerQuality >= 7 ? '#00ff41' : '#feb700'} />
        <ScorePip label="FIT" val={candidate.huntScore.roleFit} color="#feb700" />
        <ScorePip label="CONF" val={candidate.huntScore.evidenceConfidence}
          color={candidate.huntScore.evidenceConfidence >= 6 ? '#00ff41' : '#84967e'} />
      </div>

      {/* Top signal / top risk */}
      {(candidate.topSignal || candidate.topRisk) && (
        <div className="space-y-1.5">
          {candidate.topSignal && (
            <div className="flex items-start gap-1.5">
              <span className="text-[#00ff41] text-[10px] flex-shrink-0 mt-px">+</span>
              <span className="font-mono text-[9px] text-[#b9ccb2] leading-relaxed line-clamp-2">{candidate.topSignal}</span>
            </div>
          )}
          {candidate.topRisk && (
            <div className="flex items-start gap-1.5">
              <span className="text-[#feb700] text-[10px] flex-shrink-0 mt-px">!</span>
              <span className="font-mono text-[9px] text-[#feb700]/80 leading-relaxed line-clamp-2">{candidate.topRisk}</span>
            </div>
          )}
        </div>
      )}

      {/* Evidence count + validation badge */}
      <div className="flex items-center gap-3">
        <span className={`font-mono text-[8px] px-1.5 py-0.5 ${
          candidate.validationStatus === 'validated' ? 'bg-[#00ff41]/10 text-[#00ff41]' :
          candidate.validationStatus === 'rejected'  ? 'bg-[#93000a]/20 text-[#ffb4ab]' :
          'bg-[#1a1f26] text-[#84967e]'
        }`}>
          {candidate.validationStatus.toUpperCase()}
        </span>
        {candidate.evidence.length > 0 && (
          <span className="font-mono text-[8px] text-[#3b4b37]">
            {candidate.evidence.length} ARTIFACT{candidate.evidence.length !== 1 ? 'S' : ''}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#1a1f26]/60">
        {candidate.bestArtifactUrl && (
          <Link
            href={`/audit?url=${encodeURIComponent(candidate.bestArtifactUrl)}`}
            className="flex-1 py-1.5 text-center font-['Space_Grotesk'] font-bold text-[9px] uppercase tracking-widest border border-[#3b4b37]/60 text-[#84967e] hover:border-[#00ff41]/40 hover:text-[#00ff41] transition-colors"
          >
            AUDIT
          </Link>
        )}
        {candidate.reportId ? (
          <Link
            href={`/diligence?reportId=${candidate.reportId}`}
            className="flex-1 py-1.5 text-center font-['Space_Grotesk'] font-bold text-[9px] uppercase tracking-widest border border-[#3b4b37]/60 text-[#84967e] hover:border-[#feb700]/40 hover:text-[#feb700] transition-colors"
          >
            DOSSIER
          </Link>
        ) : (
          <button
            onClick={() => onAnalyze?.(candidate.id)}
            disabled={isAnalyzing}
            className="flex-1 py-1.5 text-center font-['Space_Grotesk'] font-bold text-[9px] uppercase tracking-widest border border-[#3b4b37]/60 text-[#84967e] hover:border-[#00ff41]/40 hover:text-[#00ff41] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'ANALYZING...' : 'ANALYZE'}
          </button>
        )}
      </div>
    </div>
  );
}
