'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { BountyInput } from '@/components/bounty/BountyInput';
import { HydrationChat } from '@/components/bounty/HydrationChat';
import { AgentTracker } from '@/components/tracker/AgentTracker';
import { SearchPhaseNav } from '@/components/search/SearchPhaseNav';
import { ShortlistPhase } from '@/components/shortlist/ShortlistPhase';
import { Button } from '@/components/ui/button';
import { AgentPhase, SearchPhase, Vendor, ForensicScore } from '@/types';
import { computeTelemetry } from '@/lib/telemetry';
import { NodeMap } from '@/components/search/NodeMap';
import { TelemetryPanel } from '@/components/search/TelemetryPanel';
import { LiveInterrogationLog } from '@/components/search/LiveInterrogationLog';
import { SessionMapSidebar } from '@/components/search/SessionMapSidebar';
import { PoolSummaryPanel } from '@/components/search/PoolSummaryPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  title: string;
  preview: string;
  status: 'COMPLETE' | 'ACTIVE' | 'PENDING';
  agent_phase?: string;
  created_at?: string;
}

interface AgentLog {
  id: string;
  bounty_id: string;
  phase: string;
  message: string;
  metadata?: any;
  created_at: string;
}



// ─── Prompt telemetry helpers ─────────────────────────────────────────────────

const PHASE_TAG: Record<string, { label: string; color: string }> = {
  dispatching:    { label: 'INFO',  color: '#84967e' },
  navigating:     { label: 'INFO',  color: '#84967e' },
  vetting:        { label: 'SCAN',  color: '#00ff41' },
  awaiting_quote: { label: 'HIT',   color: '#00ff41' },
  quote_received: { label: 'HIT',   color: '#00ff41' },
  failed:         { label: 'WARN',  color: '#ffb4ab' },
};


// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('brief');
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [draftPrompt, setDraftPrompt] = useState<string>('');
  const [logs, setLogs] = useState<{ message: string }[]>([]);
  const [huntLogs, setHuntLogs] = useState<AgentLog[]>([]);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [alternatives, setAlternatives] = useState<{ id: string; name: string; credentials: string; githubUrl?: string; summary: string; quoteAmount: number }[]>([]);
  const [bountyId, setBountyId] = useState<string | null>(null);
  const [forensicReport, setForensicReport] = useState<ForensicScore | null>(null);
const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawAgentOutput, setRawAgentOutput] = useState<string | null>(null);
  const [rawOutputExpanded, setRawOutputExpanded] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const telemetry = computeTelemetry(draftPrompt);
  const wordCount = draftPrompt ? draftPrompt.trim().split(/\s+/).filter(Boolean).length : null;
  const techTermsMatch = draftPrompt ? draftPrompt.match(/\b(rust|go|golang|typescript|python|kubernetes|docker|postgres|redis|kafka|grpc|api|async|concurrent|distributed|state|machine|architecture|system|design|performance|latency|throughput|memory|race|condition|mutex|channel|interface|lifetime|generic|trait|protocol|consensus|raft|paxos|sharding|replication)\b/gi) : null;
  const techTermCount = techTermsMatch ? techTermsMatch.length : null;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load sessions
  useEffect(() => {
    supabase
      .from('bounties')
      .select('id, title, description, agent_phase, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSessions(data.map((b) => ({
            id: b.id,
            title: b.title || b.description?.substring(0, 40) || 'Untitled',
            preview: b.description?.substring(0, 60) || '',
            status: b.agent_phase === 'quote_received' || b.agent_phase === 'settled'
              ? 'COMPLETE' : b.agent_phase && b.agent_phase !== 'idle' ? 'ACTIVE' : 'PENDING',
            agent_phase: b.agent_phase,
            created_at: b.created_at,
          })));
        }
        setSessionsLoading(false);
      });
  }, [bountyId]);

  // Auto-advance search phase based on agent phase
  useEffect(() => {
    if (phase === 'idle' || phase === 'hydrating' || phase === 'failed') setSearchPhase('brief');
    else if (phase === 'dispatching') setSearchPhase('capability-map');
    else if (phase === 'navigating' || phase === 'vetting' || phase === 'awaiting_quote') setSearchPhase('hunt');
    else if (phase === 'quote_received' || phase === 'completed') setSearchPhase('shortlist');
  }, [phase]);

  // Realtime hunt logs subscription
  useEffect(() => {
    if (!bountyId) return;
    setHuntLogs([]);

    supabase
      .from('agent_logs')
      .select('*')
      .eq('bounty_id', bountyId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setHuntLogs(data); });

    const channel = supabase
      .channel(`hunt:${bountyId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'agent_logs',
        filter: `bounty_id=eq.${bountyId}`,
      }, (payload) => {
        setHuntLogs(prev => [...prev, payload.new as AgentLog]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bountyId]);

  // Load a previous bounty session by ID
  const loadBounty = useCallback(async (id: string) => {
    if (id === bountyId) return;
    try {
      const { data: vendors } = await supabase
        .from('vendors').select('*').eq('bounty_id', id).order('created_at', { ascending: true });
      const primaryVendor = vendors?.find((v) => v.is_primary !== false) ?? vendors?.[0] ?? null;
      const altVendors = vendors?.filter((v) => v.is_primary === false) ?? [];

      const { data: reports } = await supabase
        .from('engineer_reports').select('*').eq('bounty_id', id)
        .order('created_at', { ascending: false }).limit(1);
      const report = reports?.[0] ?? null;

      const { data: agentLogs } = await supabase
        .from('agent_logs').select('message').eq('bounty_id', id)
        .order('created_at', { ascending: true }).limit(30);

      setBountyId(id);
      setLogs(agentLogs || []);
      setForensicReport(null);
      setAlternatives([]);
      setError(null);
      setRawAgentOutput(null);

      if (primaryVendor) {
        setVendor({
          id: primaryVendor.id,
          bountyId: id,
          name: primaryVendor.name,
          credentials: primaryVendor.credentials || '',
          quoteAmount: primaryVendor.quote_amount || 0,
          linkedinUrl: primaryVendor.linkedin_url,
          githubUrl: primaryVendor.github_url,
          websiteUrl: primaryVendor.website_url,
          summary: primaryVendor.summary || '',
          isVerified: primaryVendor.is_verified ?? true,
        });
        setAlternatives(altVendors.map((v) => ({
          id: v.id, name: v.name, credentials: v.credentials || '',
          githubUrl: v.github_url, summary: v.summary || '', quoteAmount: v.quote_amount || 0,
        })));
      } else {
        setVendor(null);
      }

      if (report) {
        setForensicReport({
          gritScore: report.grit_score,
          archetype: report.archetype || 'Uncategorized',
          dimensions: report.dimensions || { edgeCaseDensity: 0, architecturalIntent: 0, codeFingerprint: 0, testingRigor: 0 },
          gritMarkers: report.grit_markers || [],
          redFlags: report.red_flags || [],
          justification: report.justification || '',
          recommendation: report.recommendation || 'NEEDS_HUMAN_REVIEW',
        });
        setPhase('quote_received');
      } else if (primaryVendor) {
        setPhase('quote_received');
      } else {
        setPhase('idle');
      }
    } catch (err: any) {
      console.error('Failed to load bounty:', err);
    }
  }, [bountyId, supabase]);

  const startHydration = (data: any) => {
    setInitialPrompt(data.description);
    setDraftPrompt(data.description);
    setPhase('hydrating');
  };

  const handleDispatch = async (finalPrompt: string) => {
    setPhase('dispatching');
    setVendor(null);
    setAlternatives([]);
    setForensicReport(null);

    setError(null);
    setRawAgentOutput(null);
    setIsLoading(true);
    setLogs([{ message: 'OCAP Council initialized. Submitting bounty...' }]);
    try {
      const createRes = await fetch('/api/bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: finalPrompt, title: finalPrompt.split('\n')[0].substring(0, 50), budget: 500, category: 'Procurement' }),
      });
      if (!createRes.ok) throw new Error('Failed to create bounty');
      const bounty = await createRes.json();
      setBountyId(bounty.id);
      setPhase('navigating');
      setLogs(prev => [...prev, { message: 'Bounty created. Dispatching Perplexity Computer Agent...' }]);

      const dispatchRes = await fetch(`/api/bounty/${bounty.id}/dispatch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      });
      const rawText = await dispatchRes.text();
      let result: any;
      try { result = JSON.parse(rawText); }
      catch {
        setRawAgentOutput(rawText);
        throw new Error('Agent returned non-JSON response (rate limit or parse error)');
      }
      if (!dispatchRes.ok) {
        if (result?.rawOutput) setRawAgentOutput(result.rawOutput);
        throw new Error(result?.error || 'Agent dispatch failed');
      }
      setPhase('quote_received');
      setLogs(prev => [...prev, { message: `Council Recommendation ready: ${result.vendor?.name || 'Vendor found'}` }]);
      if (result.vendor) {
        setVendor({
          id: result.vendor.id, bountyId: bounty.id, name: result.vendor.name || 'Agent Result',
          credentials: result.vendor.credentials || '', quoteAmount: result.vendor.quoteAmount || 0,
          linkedinUrl: result.vendor.linkedinUrl, githubUrl: result.vendor.githubUrl,
          websiteUrl: result.vendor.websiteUrl, summary: result.vendor.summary || '',
          isVerified: result.vendor.isVerified ?? true,
        });
      }
      if (result.alternatives && result.alternatives.length > 0) setAlternatives(result.alternatives);
      if (result.rawOutput) setRawAgentOutput(result.rawOutput);
    } catch (err: any) {
      setPhase('failed');
      setError(err.message);
      setLogs(prev => [...prev, { message: `ERROR: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setPhase('idle');
    setVendor(null);
    setAlternatives([]);
    setForensicReport(null);

    setLogs([]);
    setHuntLogs([]);
    setBountyId(null);
    setError(null);
    setRawAgentOutput(null);
    setRawOutputExpanded(false);
    setDraftPrompt('');
  };

  const contextDepth = Math.min(100, telemetry.finalPromptBuild + (phase !== 'idle' ? 20 : 0));



  // Hunt phase col3: node map + phase breakdown
  const huntCol3 = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#1a1f26]/40">
        <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">ACTIVE TARGETS</span>
      </div>
      <NodeMap logs={huntLogs} />
      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-3">PHASE DISTRIBUTION</div>
        {huntLogs.length === 0 ? (
          <div className="font-mono text-[9px] text-[#3b4b37]">AWAITING_DATA</div>
        ) : (
          <div className="space-y-2">
            {Object.entries(
              huntLogs.reduce((acc, l) => { acc[l.phase] = (acc[l.phase] || 0) + 1; return acc; }, {} as Record<string, number>)
            ).map(([ph, count]) => {
              const pct = Math.round((count / huntLogs.length) * 100);
              const tag = PHASE_TAG[ph] ?? { label: ph.toUpperCase(), color: '#84967e' };
              return (
                <div key={ph}>
                  <div className="flex items-center justify-between mb-0.5">
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
    </div>
  );



  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Top Bar */}
      <header className="fixed top-0 left-[240px] right-0 h-11 bg-[#0b0e14]/95 backdrop-blur-md border-b border-[#1a1f26]/60 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <span className="font-['Space_Grotesk'] font-bold text-[#00ff41] text-sm">CONSOLE_ALPHA</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[12px] text-[#84967e]">search</span>
            <input className="bg-[#191c22] border border-[#3b4b37]/40 text-[#84967e] font-mono text-[10px] pl-6 pr-3 py-1.5 w-36 focus:outline-none focus:border-[#00ff41]/40 placeholder:text-[#3b4b37]"
              placeholder="QUERY_LOGS..." style={{ borderRadius: '0px' }} />
          </div>
        </div>
      </header>

      {/* Pipeline status indicator — read-only, not navigable */}
      <SearchPhaseNav phase={searchPhase} />

      {/* 3-column layout */}
      <div className="ml-[240px] pt-[76px] flex h-[calc(100vh-76px)]">

        {/* Col 1: Session Map */}
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
            <button onClick={resetAll} className="font-mono text-[8px] text-[#3b4b37] hover:text-[#84967e] uppercase tracking-widest transition-colors">+ NEW</button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {sessionsLoading && <div className="px-4 py-3 font-mono text-[9px] text-[#3b4b37]">LOADING_SESSIONS...</div>}
            {!sessionsLoading && sessions.length === 0 && <div className="px-4 py-3 font-mono text-[9px] text-[#3b4b37]">NO_SESSIONS_YET</div>}
            {sessions.map((s) => (
              <div key={s.id} onClick={() => loadBounty(s.id)}
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
              <span className="font-mono text-[9px] text-[#84967e] uppercase">BRIEF_CONFIDENCE</span>
              <span className="font-mono text-[9px] text-[#00ff41]">{contextDepth}%</span>
            </div>
            <div className="h-1 bg-[#1a1f26]">
              <div className="h-full bg-[#00ff41] transition-all duration-300" style={{ width: `${contextDepth}%` }} />
            </div>
          </div>
        </div>

        {/* Col 2: Phase-conditional main content */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#1a1f26]/60 overflow-hidden">
          {/* Brief + Capability Map: existing architect flow */}
          {(searchPhase === 'brief' || searchPhase === 'capability-map') && (
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {phase === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <BountyInput onDispatch={startHydration} isLoading={isLoading} onDescriptionChange={setDraftPrompt} />
                  </motion.div>
                )}
                {phase === 'hydrating' && (
                  <motion.div key="hydrating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <HydrationChat initialPrompt={initialPrompt} onComplete={handleDispatch} onCancel={() => setPhase('idle')} />
                  </motion.div>
                )}
                {phase !== 'idle' && phase !== 'hydrating' && (
                  <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <AgentTracker currentPhase={phase} logs={logs} bountyId={bountyId ?? undefined} />
                    {phase === 'failed' && (
                      <div className="border border-[#ffb4ab]/20 bg-[#93000a]/5 p-8">
                        <div className="font-['Space_Grotesk'] font-bold text-[#ffb4ab] mb-2">AGENT DISPATCH FAILED</div>
                        <p className="font-mono text-[10px] text-[#84967e] mb-4">{error}</p>
                        {rawAgentOutput && (
                          <div className="mb-4">
                            <button onClick={() => setRawOutputExpanded(v => !v)}
                              className="flex items-center gap-2 font-mono text-[9px] text-[#feb700] hover:text-[#ffba20] uppercase tracking-widest mb-2 transition-colors">
                              <span className="material-symbols-outlined text-[12px]">{rawOutputExpanded ? 'expand_less' : 'expand_more'}</span>
                              RAW AGENT OUTPUT {rawOutputExpanded ? '▲' : '▼'}
                            </button>
                            {rawOutputExpanded && (
                              <div className="bg-[#10131a] border border-[#feb700]/20 p-3 max-h-48 overflow-y-auto">
                                <pre className="font-mono text-[9px] text-[#84967e] whitespace-pre-wrap break-all">{rawAgentOutput}</pre>
                              </div>
                            )}
                          </div>
                        )}
                        <button onClick={resetAll} className="px-4 py-2 bg-[#1d2026] border border-[#3b4b37] text-[#e1e2eb] font-['Space_Grotesk'] font-bold text-[10px] uppercase hover:bg-[#272a31] transition-colors">
                          TRY AGAIN
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Hunt: live log viewer */}
          {searchPhase === 'hunt' && <LiveInterrogationLog bountyId={bountyId} logs={huntLogs} />}

          {/* Shortlist: candidate grid */}
          {searchPhase === 'shortlist' && (
            <div className="flex-1 overflow-hidden">
              <ShortlistPhase bountyId={bountyId} />
            </div>
          )}

          {/* Brief idle bottom bar */}
          {searchPhase === 'brief' && phase === 'idle' && (
            <div className="border-t border-[#1a1f26]/60 p-4 bg-[#0b0e14]">
              <div className="flex items-center gap-2 text-[#84967e] font-mono text-[10px]">
                <span>/upload_spec</span>
                <span className="text-[#3b4b37]">·</span>
                <span>/diagram</span>
              </div>
            </div>
          )}
        </div>

        {/* Col 3: Phase-conditional right panel */}
        <div className="w-[260px] flex-shrink-0 flex flex-col bg-[#0b0e14] overflow-hidden">
          {/* Brief + Capability Map: prompt telemetry */}
          {(searchPhase === 'brief' || searchPhase === 'capability-map') && (
            <>
              <div className="px-5 py-4 border-b border-[#1a1f26]/40">
                <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-sm uppercase tracking-tight">PROMPT TELEMETRY</div>
              </div>
              <div className="px-5 py-4 border-b border-[#1a1f26]/40">
                <div className="flex items-end justify-between mb-2">
                  <span className="font-mono text-[9px] text-[#84967e] uppercase tracking-widest">FINAL PROMPT BUILD</span>
                  <span className={`font-['Space_Grotesk'] font-black text-xl transition-colors ${
                    telemetry.finalPromptBuild >= 80 ? 'text-[#00ff41]' : telemetry.finalPromptBuild >= 40 ? 'text-[#feb700]' : 'text-[#84967e]'
                  }`}>{telemetry.finalPromptBuild}%</span>
                </div>
                <div className="h-1 bg-[#1a1f26]">
                  <div className="h-full transition-all duration-300" style={{
                    width: `${telemetry.finalPromptBuild}%`,
                    backgroundColor: telemetry.finalPromptBuild >= 80 ? '#00ff41' : telemetry.finalPromptBuild >= 40 ? '#feb700' : '#84967e'
                  }} />
                </div>
                <div className="font-mono text-[9px] text-[#84967e] mt-1.5">EST_COMPLETION: {telemetry.estCompletion}</div>
              </div>
              <div className="px-5 py-4 border-b border-[#1a1f26]/40">
                <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-3">HUNTING READINESS VECTORS</div>
                {[
                  { label: 'Clarity Score', val: telemetry.clarity, color: telemetry.clarity >= 0.6 ? '#00ff41' : '#feb700' },
                  { label: 'Constraint Density', val: telemetry.constraint, color: telemetry.constraint >= 0.6 ? '#00ff41' : '#feb700' },
                  { label: 'Ambiguity Index', val: telemetry.ambiguity, color: telemetry.ambiguity <= 0.3 ? '#00ff41' : '#ffb4ab' },
                ].map((v) => (
                  <div key={v.label} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['Space_Grotesk'] text-[10px] text-[#b9ccb2]">{v.label}</span>
                      <span className="font-mono text-[10px] transition-colors" style={{ color: v.color }}>{v.val.toFixed(2)}</span>
                    </div>
                    <div className="h-1 bg-[#1a1f26]">
                      <div className="h-full transition-all duration-300" style={{ width: `${v.val * 100}%`, backgroundColor: v.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 flex-1 overflow-y-auto">
                <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-3">EXTRACTED PARAMETERS</div>
                <div className="space-y-2">
                  {draftPrompt ? (
                    <>
                      <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3">
                        <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">ROLE</div>
                        <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px] truncate">
                          {draftPrompt.split(/[\n.]/)[0].trim().substring(0, 60) || '—'}
                        </div>
                      </div>
                      <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3">
                        <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">STACK</div>
                        <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px]">
                          {(() => {
                            const terms = (draftPrompt.match(/\b(rust|go|golang|typescript|python|kubernetes|docker|postgres|redis|kafka|grpc|aws|gcp|azure|terraform|prometheus|grafana|react|node|java|scala|c\+\+|c#|solidity|elixir|rails)\b/gi) || []);
                            const unique = [...new Set(terms.map(t => t.toLowerCase()))].slice(0, 5);
                            return unique.length > 0 ? unique.join(', ').toUpperCase() : '—';
                          })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="font-mono text-[9px] text-[#3b4b37]">AWAITING_INPUT</div>
                  )}
                  <div className={`bg-[#10131a] border p-3 transition-colors ${
                    telemetry.finalPromptBuild >= 80 ? 'border-[#00ff41]/30' :
                    telemetry.finalPromptBuild >= 40 ? 'border-[#feb700]/20' : 'border-[#1a1f26]/60'
                  }`}>
                    <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">STATUS</div>
                    <div className={`font-['Space_Grotesk'] font-bold text-[11px] ${
                      telemetry.finalPromptBuild >= 80 ? 'text-[#00ff41]' :
                      telemetry.finalPromptBuild >= 40 ? 'text-[#feb700]' : 'text-[#84967e]'
                    }`}>
                      {telemetry.finalPromptBuild >= 80 ? 'READY_TO_DISPATCH' :
                       telemetry.finalPromptBuild >= 40 ? 'NEEDS_REFINEMENT' : 'AWAITING_INPUT'}
                    </div>
                  </div>
                </div>
              </div>
              {phase !== 'idle' && (
                <div className="px-5 py-4 border-t border-[#1a1f26]/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] text-[#84967e] uppercase">TARGET ARTIFACT</span>
                    <span className="material-symbols-outlined text-[12px] text-[#84967e]">code</span>
                  </div>
                  <div className="bg-[#10131a] border border-[#1a1f26]/40 p-2 font-mono text-[9px] text-[#84967e]">
                    <div>type HuntingPrompt = {'{'}</div>
                    <div className="pl-3">role: "System Architect",</div>
                    <div className="pl-3">{'constraints: Array<Condition>,'}</div>
                    <div className="pl-3">evaluation_matrix: Metrics</div>
                    <div>{'}'}</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Hunt: node map + stats */}
          {searchPhase === 'hunt' && huntCol3}

          {/* Shortlist: pool summary */}
          {searchPhase === 'shortlist' && <PoolSummaryPanel vendor={vendor} alternativesCount={alternatives.length} forensicReport={forensicReport} />}
        </div>
      </div>

    </div>
  );
}
