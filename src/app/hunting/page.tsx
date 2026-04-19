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
          // Auto-select the most recent active bounty
          const active = data.find(b => b.agent_phase && b.agent_phase !== 'idle' && b.agent_phase !== 'quote_received');
          setActiveBountyId(active?.id ?? data[0].id);
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
            <div className="flex-1 relative overflow-hidden bg-[#0b0e14]">
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
              {/* Nodes from logs */}
              {logs.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-[9px] text-[#3b4b37]">NO_TARGETS_YET</span>
                </div>
              ) : (
                <div className="absolute inset-0 p-4 flex flex-col gap-2 overflow-y-auto">
                  {bounties.filter(b => b.id === activeBountyId).map(b => (
                    <div key={b.id} className="border border-[#00ff41]/30 bg-[#00ff41]/5 p-2">
                      <div className="font-mono text-[9px] text-[#00ff41] truncate">{b.title?.substring(0, 30) || b.id.substring(0, 8)}</div>
                      <div className="font-mono text-[8px] text-[#84967e] mt-0.5">{b.agent_phase?.toUpperCase()}</div>
                    </div>
                  ))}
                  {/* Show unique developer handles from logs */}
                  {Array.from(new Set(
                    logs
                      .filter(l => l.metadata?.developerHandle)
                      .map(l => l.metadata.developerHandle as string)
                  )).map(handle => (
                    <div key={handle} className="border border-[#feb700]/20 bg-[#feb700]/5 p-2">
                      <div className="font-mono text-[9px] text-[#feb700] truncate">{handle}</div>
                      <div className="font-mono text-[8px] text-[#84967e] mt-0.5">CANDIDATE</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
