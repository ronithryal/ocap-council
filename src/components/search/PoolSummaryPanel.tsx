'use client';

export interface PoolSummaryPanelProps {
  vendor: {
    name: string;
    githubUrl?: string | null;
  } | null;
  alternativesCount: number;
  forensicReport: {
    gritScore: number;
    recommendation: string;
  } | null;
}

export function PoolSummaryPanel({
  vendor,
  alternativesCount,
  forensicReport,
}: PoolSummaryPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[#1a1f26]/40">
        <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-sm uppercase tracking-tight">POOL SUMMARY</div>
      </div>
      <div className="px-5 py-4 flex-1 space-y-4">
        {vendor && (
          <div className="space-y-2">
            <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3">
              <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">PRIMARY</div>
              <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px]">{vendor.name}</div>
            </div>
            {vendor.githubUrl && (
              <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3">
                <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">SMOKING GUN</div>
                <a href={vendor.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[9px] text-[#00ff41] truncate block hover:underline">
                  {vendor.githubUrl}
                </a>
              </div>
            )}
            {alternativesCount > 0 && (
              <div className="bg-[#10131a] border border-[#feb700]/20 p-3">
                <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">IN POOL</div>
                <div className="font-['Space_Grotesk'] font-bold text-[#feb700] text-[11px]">
                  {alternativesCount + 1} candidate{alternativesCount + 1 !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        )}
        {!vendor && (
          <div className="font-mono text-[9px] text-[#3b4b37]">AWAITING_RESULTS</div>
        )}
        {forensicReport && (
          <div className="bg-[#10131a] border border-[#00ff41]/20 p-3">
            <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">GRIT SCORE</div>
            <div className="font-['Space_Grotesk'] font-black text-[#00ff41] text-xl">{forensicReport.gritScore}/10</div>
            <div className="font-mono text-[9px] text-[#84967e] mt-0.5">{forensicReport.recommendation}</div>
          </div>
        )}
      </div>
    </div>
  );
}
