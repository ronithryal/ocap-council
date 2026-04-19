'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface AgentLog {
  id: string;
  bounty_id: string;
  phase: string;
  message: string;
  metadata?: any;
  created_at: string;
}

interface Bounty {
  id: string;
  title: string;
  agent_phase: string;
}

// ─── NodeMap component ────────────────────────────────────────────────────────

interface NodeMapProps {
  activeBounty: Bounty | null;
  logs: AgentLog[];
}

function extractRepoName(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/[^/]+\/([^/]+)/);
  return m ? m[1] : null;
}

function NodeMap({ activeBounty, logs }: NodeMapProps) {
  if (!activeBounty && logs.length === 0) {
    return (
      <div className="flex-1 relative overflow-hidden bg-[#0b0e14] flex items-center justify-center">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <span className="font-mono text-[9px] text-[#3b4b37] relative z-10">NO_TARGETS_YET</span>
      </div>
    );
  }

  // Collect unique candidates and repos from log metadata
  const candidates = Array.from(new Set(
    logs.filter(l => l.metadata?.developerHandle).map(l => l.metadata.developerHandle as string)
  ));
  const repos = Array.from(new Set(
    logs
      .filter(l => l.metadata?.smokingGunUrl)
      .map(l => extractRepoName(l.metadata.smokingGunUrl as string))
      .filter(Boolean) as string[]
  ));

  // Fixed positions for up to 5 nodes in a 268×(flex) box
  // BOUNTY at top-center, CANDIDATEs in middle row, REPOs at bottom
  const W = 268;
  const H = 220;
  const bountyX = W / 2;
  const bountyY = 36;

  const candidateNodes = candidates.slice(0, 3).map((handle, i) => {
    const total = Math.min(candidates.length, 3);
    const x = (W / (total + 1)) * (i + 1);
    return { id: `c-${i}`, label: handle, x, y: H / 2, kind: 'candidate' as const };
  });

  const repoNodes = repos.slice(0, 3).map((repo, i) => {
    const total = Math.min(repos.length, 3);
    const x = (W / (total + 1)) * (i + 1);
    return { id: `r-${i}`, label: repo, x, y: H - 36, kind: 'repo' as const };
  });

  const NODE_COLORS = {
    bounty: '#00ff41',
    candidate: '#feb700',
    repo: '#84967e',
  };

  return (
    <div className="flex-1 relative overflow-hidden bg-[#0b0e14]" style={{ minHeight: 180 }}>
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Lines: bounty → each candidate */}
        {candidateNodes.map(cn => (
          <line
            key={`l-bc-${cn.id}`}
            x1={bountyX} y1={bountyY}
            x2={cn.x} y2={cn.y}
            stroke="#00ff41"
            strokeWidth="0.5"
            strokeOpacity="0.3"
            strokeDasharray="3 3"
          />
        ))}
        {/* Lines: each candidate → each repo */}
        {candidateNodes.map(cn =>
          repoNodes.map(rn => (
            <line
              key={`l-cr-${cn.id}-${rn.id}`}
              x1={cn.x} y1={cn.y}
              x2={rn.x} y2={rn.y}
              stroke="#feb700"
              strokeWidth="0.5"
              strokeOpacity="0.2"
              strokeDasharray="2 4"
            />
          ))
        )}
      </svg>

      {/* Bounty node */}
      {activeBounty && (
        <div
          className="absolute z-10 flex flex-col items-center"
          style={{ left: bountyX, top: bountyY, transform: 'translate(-50%, -50%)' }}
        >
          <div
            className="border px-2 py-1 text-center"
            style={{ borderColor: `${NODE_COLORS.bounty}50`, backgroundColor: `${NODE_COLORS.bounty}10` }}
          >
            <div className="font-mono text-[8px] uppercase" style={{ color: NODE_COLORS.bounty }}>BOUNTY</div>
            <div className="font-mono text-[7px] text-[#84967e] truncate max-w-[80px]">
              {activeBounty.title?.substring(0, 16) || activeBounty.id.substring(0, 8)}
            </div>
          </div>
        </div>
      )}

      {/* Candidate nodes */}
      {candidateNodes.map(cn => (
        <div
          key={cn.id}
          className="absolute z-10 flex flex-col items-center"
          style={{ left: cn.x, top: cn.y, transform: 'translate(-50%, -50%)' }}
        >
          <div
            className="border px-2 py-1 text-center"
            style={{ borderColor: `${NODE_COLORS.candidate}40`, backgroundColor: `${NODE_COLORS.candidate}10` }}
          >
            <div className="font-mono text-[8px] uppercase" style={{ color: NODE_COLORS.candidate }}>CANDIDATE</div>
            <div className="font-mono text-[7px] text-[#84967e] truncate max-w-[72px]">{cn.label}</div>
          </div>
        </div>
      ))}

      {/* Repo nodes */}
      {repoNodes.map(rn => (
        <div
          key={rn.id}
          className="absolute z-10 flex flex-col items-center"
          style={{ left: rn.x, top: rn.y, transform: 'translate(-50%, -50%)' }}
        >
          <div
            className="border px-2 py-1 text-center"
            style={{ borderColor: `${NODE_COLORS.repo}40`, backgroundColor: `${NODE_COLORS.repo}10` }}
          >
            <div className="font-mono text-[8px] uppercase" style={{ color: NODE_COLORS.repo }}>REPO</div>
            <div className="font-mono text-[7px] text-[#84967e] truncate max-w-[72px]">{rn.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const PHASE_TAG: Record<string, { label: string; color: string }> = {
  dispatching:    { label: 'INFO',         color: '#84967e' },
  navigating:     { label: 'INFO',         color: '#84967e' },
  vetting:        { label: 'SCAN',         color: '#00ff41' },
  awaiting_quote: { label: 'HIT',          color: '#00ff41' },
  quote_received: { label: 'HIT',          color: '#00ff41' },
  failed:         { label: 'WARN',         color: '#ffb4ab' },
  ai_slop:        { label: 'AI_SLOP_FLAG', color: '#feb700' },
};

function getTag(phase: string, message: string) {
  if (message.toLowerCase().includes('slop') || message.toLowerCase().includes('flag')) {
    return { label: 'AI_SLOP_FLAG', color: '#feb700' };
  }
  if (message.toLowerCase().includes('fail') || message.toLowerCase().includes('error')) {
    return { label: 'WARN', color: '#ffb4ab' };
  }
  return PHASE_TAG[phase] ?? { label: 'INFO', color: '#84967e' };
}

export default function HuntingPage() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [activeBountyId, setActiveBountyId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load recent bounties for the selector
  useEffect(() => {
    supabase
      .from('bounties')
      .select('id, title, agent_phase')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setBounties(data);
          // Auto-select the most recent bounty (any phase)
          setActiveBountyId(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  // Load logs for selected bounty + subscribe to Realtime
  useEffect(() => {
    if (!activeBountyId) return;
    setLogs([]);

    // Initial fetch
    supabase
      .from('agent_logs')
      .select('*')
      .eq('bounty_id', activeBountyId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setLogs(data);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`agent_logs:${activeBountyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_logs',
          filter: `bounty_id=eq.${activeBountyId}`,
        },
        (payload) => {
          setLogs(prev => [...prev, payload.new as AgentLog]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBountyId]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const activeBounty = bounties.find(b => b.id === activeBountyId);
  const phaseColor = activeBounty
    ? (PHASE_TAG[activeBounty.agent_phase]?.color ?? '#84967e')
    : '#84967e';

  // Compute source breakdown from log metadata
  const sources: Record<string, number> = {};
  logs.forEach(log => {
    if (log.metadata?.keptFiles) {
      (log.metadata.keptFiles as string[]).forEach(f => {
        const src = f.startsWith('src/') ? 'SOURCE_CODE' : f.includes('.') ? 'CONFIG' : 'OTHER';
        sources[src] = (sources[src] || 0) + 1;
      });
    }
  });
  const totalSources = Object.values(sources).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Top Bar */}
      <header className="fixed top-0 left-[240px] right-0 h-11 bg-[#0b0e14]/95 backdrop-blur-md border-b border-[#1a1f26]/60 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <span className="font-['Space_Grotesk'] font-bold text-[#feb700] text-sm">HUNTING_CONSOLE</span>
          <span className="text-[#3b4b37] font-mono text-[10px]">|</span>
          {loading ? (
            <span className="font-mono text-[10px] text-[#3b4b37]">LOADING...</span>
          ) : bounties.length === 0 ? (
            <span className="font-mono text-[10px] text-[#3b4b37]">NO_ACTIVE_SESSIONS</span>
          ) : (
            <select
              value={activeBountyId ?? ''}
              onChange={e => setActiveBountyId(e.target.value)}
              className="bg-[#191c22] border border-[#3b4b37]/40 text-[#84967e] font-mono text-[10px] px-2 py-1 focus:outline-none focus:border-[#feb700]/40"
              style={{ borderRadius: '0px' }}
            >
              {bounties.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title?.substring(0, 40) || b.id.substring(0, 8)} [{b.agent_phase}]
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoScroll(v => !v)}
            className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors ${
              autoScroll
                ? 'border-[#00ff41]/40 text-[#00ff41] bg-[#00ff41]/5'
                : 'border-[#3b4b37]/40 text-[#84967e]'
            }`}
            style={{ borderRadius: '0px' }}
          >
            AUTO-SCROLL {autoScroll ? 'ON' : 'OFF'}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: phaseColor }} />
            <span className="font-mono text-[9px] uppercase" style={{ color: phaseColor }}>
              {activeBounty?.agent_phase?.toUpperCase() ?? 'IDLE'}
            </span>
          </div>
        </div>
      </header>

      <div className="ml-[240px] pt-11 flex h-[calc(100vh-44px)]">

        {/* Col 1: Live Interrogation Log */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#1a1f26]/60">
          <div className="px-5 py-3 border-b border-[#1a1f26]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-[#00ff41] rounded-full animate-pulse" />
              <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">LIVE INTERROGATION LOG</span>
            </div>
            <span className="font-mono text-[9px] text-[#3b4b37]">{logs.length} ENTRIES</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1">
            {loading && (
              <div className="text-[#3b4b37] py-4">LOADING_SESSIONS...</div>
            )}
            {!loading && logs.length === 0 && (
              <div className="text-[#3b4b37] py-4">
                {activeBountyId ? 'NO_LOGS_YET — dispatch an agent to begin hunting' : 'SELECT_A_SESSION above to view logs'}
              </div>
            )}
            {logs.map((log, i) => {
              const tag = getTag(log.phase, log.message);
              const ts = new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false });
              return (
                <div key={log.id ?? i} className="flex items-start gap-3 py-0.5 group">
                  <span className="text-[#3b4b37] flex-shrink-0 w-20">{ts}</span>
                  <span
                    className="flex-shrink-0 px-1 text-[9px] uppercase tracking-widest w-24 text-center"
                    style={{ color: tag.color, backgroundColor: `${tag.color}15` }}
                  >
                    {tag.label}
                  </span>
                  <span className="text-[#b9ccb2] flex-1 leading-relaxed">{log.message}</span>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>

          {/* Stats bar */}
          <div className="border-t border-[#1a1f26]/40 px-5 py-2 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-[#84967e]">ENTRIES:</span>
              <span className="font-mono text-[9px] text-[#00ff41]">{logs.length}</span>
            </div>
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

        {/* Col 2: Active Targets + Source Breakdown */}
        <div className="w-[300px] flex-shrink-0 flex flex-col bg-[#0b0e14]">
          {/* Active Targets Node Map */}
          <div className="border-b border-[#1a1f26]/60 flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-[#1a1f26]/40">
              <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">ACTIVE TARGETS</span>
            </div>
          <NodeMap
            activeBounty={bounties.find(b => b.id === activeBountyId) ?? null}
            logs={logs}
          />
          </div>

          {/* Source Breakdown */}
          <div className="px-4 py-4">
            <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-3">SOURCE BREAKDOWN</div>
            {logs.length === 0 ? (
              <div className="font-mono text-[9px] text-[#3b4b37]">AWAITING_DATA</div>
            ) : (
              <div className="space-y-2">
                {/* Phase distribution */}
                {Object.entries(
                  logs.reduce((acc, l) => {
                    acc[l.phase] = (acc[l.phase] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([phase, count]) => {
                  const pct = Math.round((count / logs.length) * 100);
                  const tag = PHASE_TAG[phase] ?? { label: phase.toUpperCase(), color: '#84967e' };
                  return (
                    <div key={phase}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[9px]" style={{ color: tag.color }}>{tag.label}</span>
                        <span className="font-mono text-[9px] text-[#84967e]">{pct}%</span>
                      </div>
                      <div className="h-1 bg-[#1a1f26]">
                        <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: tag.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link to Architect */}
          <div className="px-4 py-3 border-t border-[#1a1f26]/40">
            <Link
              href="/"
              className="block w-full py-2 bg-[#191c22] border border-[#3b4b37]/40 text-center font-['Space_Grotesk'] font-bold text-[10px] uppercase text-[#84967e] hover:text-[#e1e2eb] hover:border-[#3b4b37] transition-colors"
              style={{ borderRadius: '0px' }}
            >
              ← BACK TO ARCHITECT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
