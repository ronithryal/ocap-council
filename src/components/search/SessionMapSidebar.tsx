'use client';

export interface Session {
  id: string;
  title: string;
  preview: string;
  status: 'COMPLETE' | 'ACTIVE' | 'PENDING';
}

export interface SessionMapSidebarProps {
  sessions: Session[];
  sessionsLoading: boolean;
  bountyId: string | null;
  contextDepth: number;
  onResetAll: () => void;
  onLoadBounty: (id: string) => void;
}

export function SessionMapSidebar({
  sessions,
  sessionsLoading,
  bountyId,
  contextDepth,
  onResetAll,
  onLoadBounty,
}: SessionMapSidebarProps) {
  return (
    <div className="w-[260px] flex-shrink-0 border-r border-[#1a1f26]/60 flex flex-col bg-[#0b0e14]">
      <div className="px-4 py-3 border-b border-[#1a1f26]/40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-[#84967e]">manage_search</span>
          <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">SEARCH AGENT</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-1.5 w-1.5 bg-[#00ff41] rounded-full" />
          <span className="font-mono text-[9px] text-[#00ff41]">STATUS: ACTIVE</span>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-[#1a1f26]/40 flex items-center justify-between">
        <span className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e]">SESSION MAP</span>
        <button onClick={onResetAll} className="font-mono text-[8px] text-[#3b4b37] hover:text-[#84967e] uppercase tracking-widest transition-colors">+ NEW</button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sessionsLoading && <div className="px-4 py-3 font-mono text-[9px] text-[#3b4b37]">LOADING_SESSIONS...</div>}
        {!sessionsLoading && sessions.length === 0 && <div className="px-4 py-3 font-mono text-[9px] text-[#3b4b37]">NO_SESSIONS_YET</div>}
        {sessions.map((s) => (
          <div key={s.id} onClick={() => onLoadBounty(s.id)}
            className={`mx-2 mb-1 p-3 border cursor-pointer transition-colors ${
              s.id === bountyId ? 'border-[#00ff41]/30 bg-[#00ff41]/5' : 'border-[#1a1f26]/40 hover:border-[#3b4b37]/60'
            }`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px] truncate">{s.title}</span>
              <span className={`font-mono text-[8px] px-1 flex-shrink-0 ${
                s.status === 'COMPLETE' ? 'bg-[#00ff41]/20 text-[#00ff41]' :
                s.status === 'ACTIVE' ? 'bg-[#feb700]/20 text-[#feb700]' : 'bg-[#3b4b37]/20 text-[#84967e]'
              }`}>{s.status}</span>
            </div>
            <p className="font-mono text-[9px] text-[#84967e] truncate">{s.preview}</p>
          </div>
        ))}
      </div>

      {/* Context depth */}
      <div className="px-4 py-3 border-t border-[#1a1f26]/40">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[9px] text-[#84967e] uppercase">CONTEXT DEPTH</span>
          <span className="font-mono text-[9px] text-[#00ff41]">{contextDepth}%</span>
        </div>
        <div className="h-1 bg-[#1a1f26]">
          <div className="h-full bg-[#00ff41] transition-all duration-300" style={{ width: `${contextDepth}%` }} />
        </div>
      </div>
    </div>
  );
}
