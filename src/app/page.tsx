'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BountyInput } from '@/components/bounty/BountyInput';
import { HydrationChat } from '@/components/bounty/HydrationChat';
import { AgentTracker } from '@/components/tracker/AgentTracker';
import { QuoteCard } from '@/components/settlement/QuoteCard';
import { ForensicDashboard } from '@/components/forensic/ForensicDashboard';
import { Button } from '@/components/ui/button';
import { AgentPhase, Vendor, ForensicScore } from '@/types';

// Session map entry
interface Session {
  id: string;
  title: string;
  preview: string;
  status: 'COMPLETE' | 'ACTIVE' | 'PENDING';
}

export default function Home() {
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [logs, setLogs] = useState<{ message: string }[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [bountyId, setBountyId] = useState<string | null>(null);
  const [forensicReport, setForensicReport] = useState<ForensicScore | null>(null);
  const [isForensicLoading, setIsForensicLoading] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions] = useState<Session[]>([
    { id: '1', title: 'Data Pipeline Req', preview: 'Define Kafka to S3 ingestion...', status: 'COMPLETE' },
    { id: '2', title: 'Distributed State', preview: 'Raft vs Paxos evaluation...', status: 'ACTIVE' },
  ]);

  // Prompt telemetry (mock, updates as user types)
  const [telemetry] = useState({
    finalPromptBuild: 42,
    estCompletion: '2_ITERATIONS',
    clarity: 0.65,
    constraint: 0.92,
    ambiguity: 0.31,
  });

  const startHydration = (data: any) => {
    setInitialPrompt(data.description);
    setPhase('hydrating');
  };

  const runForensicAnalysis = async () => {
    if (!vendor || !bountyId) return;
    setIsForensicLoading(true);
    setPhase('vetting');
    try {
      const res = await fetch(`/api/bounty/${bountyId}/diligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor.id }),
      });
      if (!res.ok) throw new Error('Forensic analysis failed');
      const data = await res.json();
      setForensicReport(data.score);
      setLogs(prev => [...prev, { message: `Forensic Analysis complete. Grit Score: ${data.score.gritScore}/10. Call: ${data.score.recommendation}` }]);
      setPhase('quote_received');
    } catch (err: any) {
      setError(err.message);
      setLogs(prev => [...prev, { message: `Forensic Analysis failed: ${err.message}` }]);
    } finally {
      setIsForensicLoading(false);
    }
  };

  const handleDispatch = async (finalPrompt: string) => {
    setPhase('dispatching');
    setVendor(null);
    setForensicReport(null);
    setIsSettled(false);
    setError(null);
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!dispatchRes.ok) {
        const errData = await dispatchRes.json();
        throw new Error(errData.error || 'Agent dispatch failed');
      }
      const result = await dispatchRes.json();
      setPhase('quote_received');
      setLogs(prev => [...prev, { message: `Council Recommendation ready: ${result.vendor?.name || 'Vendor found'}` }]);
      if (result.vendor) {
        setVendor({
          id: result.vendor.id || 'live-vendor',
          bountyId: bounty.id,
          name: result.vendor.name || 'Agent Result',
          credentials: result.vendor.credentials || '',
          quoteAmount: result.vendor.quoteAmount || 0,
          linkedinUrl: result.vendor.linkedinUrl,
          githubUrl: result.vendor.githubUrl,
          websiteUrl: result.vendor.websiteUrl,
          summary: result.vendor.summary || '',
          isVerified: result.vendor.isVerified ?? true,
        });
      }
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
    setForensicReport(null);
    setIsSettled(false);
    setLogs([]);
    setBountyId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Top Bar */}
      <header className="fixed top-0 left-[240px] right-0 h-11 bg-[#0b0e14]/95 backdrop-blur-md border-b border-[#1a1f26]/60 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <span className="font-['Space_Grotesk'] font-bold text-[#00ff41] text-sm">CONSOLE_ALPHA</span>
          <span className="text-[#3b4b37] font-mono text-[10px]">|</span>
          {/* Tab bar */}
          {['Hydration', 'Interrogation', 'Extraction'].map((tab, i) => (
            <button
              key={tab}
              className={`font-['Space_Grotesk'] text-[11px] uppercase tracking-widest px-1 pb-0.5 transition-colors ${
                i === 0
                  ? 'text-[#00ff41] border-b border-[#00ff41]'
                  : 'text-[#84967e] hover:text-[#b9ccb2]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[12px] text-[#84967e]">search</span>
            <input
              className="bg-[#191c22] border border-[#3b4b37]/40 text-[#84967e] font-mono text-[10px] pl-6 pr-3 py-1.5 w-36 focus:outline-none focus:border-[#00ff41]/40 placeholder:text-[#3b4b37]"
              placeholder="QUERY_LOGS..."
              style={{ borderRadius: '0px' }}
            />
          </div>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="ml-[240px] pt-11 flex h-[calc(100vh-44px)]">

        {/* Col 1: Session Map (left panel) */}
        <div className="w-[260px] flex-shrink-0 border-r border-[#1a1f26]/60 flex flex-col bg-[#0b0e14]">
          <div className="px-4 py-3 border-b border-[#1a1f26]/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#84967e]">smart_toy</span>
              <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#84967e]">ARCHITECT AGENT</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-1.5 w-1.5 bg-[#00ff41] rounded-full" />
              <span className="font-mono text-[9px] text-[#00ff41]">STATUS: ACTIVE</span>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-[#1a1f26]/40">
            <span className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e]">SESSION MAP</span>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`mx-2 mb-1 p-3 border cursor-pointer transition-colors ${
                  s.status === 'ACTIVE'
                    ? 'border-[#00ff41]/30 bg-[#00ff41]/5'
                    : 'border-[#1a1f26]/40 hover:border-[#3b4b37]/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px]">{s.title}</span>
                  <span className={`font-mono text-[8px] px-1 flex-shrink-0 ${
                    s.status === 'COMPLETE' ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'bg-[#feb700]/20 text-[#feb700]'
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
              <span className="font-mono text-[9px] text-[#00ff41]">84%</span>
            </div>
            <div className="h-1 bg-[#1a1f26]">
              <div className="h-full bg-[#00ff41]" style={{ width: '84%' }} />
            </div>
          </div>
        </div>

        {/* Col 2: Main chat / input area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#1a1f26]/60">
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {phase === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <BountyInput onDispatch={startHydration} isLoading={isLoading} />
                </motion.div>
              )}
              {phase === 'hydrating' && (
                <motion.div key="hydrating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <HydrationChat
                    initialPrompt={initialPrompt}
                    onComplete={handleDispatch}
                    onCancel={() => setPhase('idle')}
                  />
                </motion.div>
              )}
              {phase !== 'idle' && phase !== 'hydrating' && (
                <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <AgentTracker currentPhase={phase} logs={logs} />
                  {forensicReport && (
                    <ForensicDashboard
                      report={forensicReport}
                      developerHandle={vendor?.name || 'Unknown'}
                      smokingGunUrl={vendor?.githubUrl || ''}
                      onHireForTrial={() => setIsSettled(true)}
                      onDoNotHire={resetAll}
                    />
                  )}
                  {vendor && !forensicReport && (
                    <div className="space-y-4">
                      <QuoteCard vendor={vendor} onSettled={() => setIsSettled(true)} />
                      <div className="bg-[#191c22] border border-[#00ff41]/20 p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-[#00ff41]/10 border border-[#00ff41]/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#00ff41] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
                          </div>
                          <div>
                            <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px] uppercase">Run Forensic Analysis</div>
                            <div className="font-mono text-[9px] text-[#84967e]">Pull raw diff · evaluate Grit vs AI-Slop</div>
                          </div>
                        </div>
                        <Button
                          onClick={runForensicAnalysis}
                          disabled={isForensicLoading}
                          className="bg-[#00ff41] hover:bg-[#72ff70] text-[#003907] font-['Space_Grotesk'] font-bold h-10 px-5 shadow-[0_0_16px_rgba(0,255,65,0.25)] transition-all"
                          style={{ borderRadius: '0px' }}
                        >
                          {isForensicLoading ? 'ANALYZING...' : 'ANALYZE GRIT'}
                        </Button>
                      </div>
                    </div>
                  )}
                  {phase === 'failed' && (
                    <div className="border border-[#ffb4ab]/20 bg-[#93000a]/5 p-8 text-center">
                      <div className="font-['Space_Grotesk'] font-bold text-[#ffb4ab] mb-2">AGENT DISPATCH FAILED</div>
                      <p className="font-mono text-[10px] text-[#84967e] mb-4">{error}</p>
                      <button onClick={resetAll} className="px-4 py-2 bg-[#1d2026] border border-[#3b4b37] text-[#e1e2eb] font-['Space_Grotesk'] font-bold text-[10px] uppercase hover:bg-[#272a31] transition-colors">
                        TRY AGAIN
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom input bar (shown when idle/hydrating) */}
          {(phase === 'idle') && (
            <div className="border-t border-[#1a1f26]/60 p-4 bg-[#0b0e14]">
              <div className="flex items-center gap-2 text-[#84967e] font-mono text-[10px]">
                <span>/upload_spec</span>
                <span className="text-[#3b4b37]">·</span>
                <span>/diagram</span>
              </div>
            </div>
          )}
        </div>

        {/* Col 3: Prompt Telemetry */}
        <div className="w-[260px] flex-shrink-0 flex flex-col bg-[#0b0e14]">
          <div className="px-5 py-4 border-b border-[#1a1f26]/40">
            <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-sm uppercase tracking-tight">PROMPT TELEMETRY</div>
          </div>

          {/* Final prompt build */}
          <div className="px-5 py-4 border-b border-[#1a1f26]/40">
            <div className="flex items-end justify-between mb-2">
              <span className="font-mono text-[9px] text-[#84967e] uppercase tracking-widest">FINAL PROMPT BUILD</span>
              <span className="font-['Space_Grotesk'] font-black text-[#00ff41] text-xl">{telemetry.finalPromptBuild}%</span>
            </div>
            <div className="h-1 bg-[#1a1f26]">
              <div className="h-full bg-[#00ff41]" style={{ width: `${telemetry.finalPromptBuild}%` }} />
            </div>
            <div className="font-mono text-[9px] text-[#84967e] mt-1.5">EST_COMPLETION: {telemetry.estCompletion}</div>
          </div>

          {/* Hunting readiness vectors */}
          <div className="px-5 py-4 border-b border-[#1a1f26]/40">
            <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-3">HUNTING READINESS VECTORS</div>
            {[
              { label: 'Clarity Score', val: telemetry.clarity, color: '#feb700' },
              { label: 'Constraint Density', val: telemetry.constraint, color: '#00ff41' },
              { label: 'Ambiguity Index', val: telemetry.ambiguity, color: '#ffb4ab' },
            ].map((v) => (
              <div key={v.label} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-['Space_Grotesk'] text-[10px] text-[#b9ccb2]">{v.label}</span>
                  <span className="font-mono text-[10px]" style={{ color: v.color }}>{v.val.toFixed(2)}</span>
                </div>
                <div className="h-1 bg-[#1a1f26]">
                  <div className="h-full" style={{ width: `${v.val * 100}%`, backgroundColor: v.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Extracted parameters */}
          <div className="px-5 py-4 flex-1">
            <div className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#84967e] mb-3">EXTRACTED PARAMETERS</div>
            {vendor ? (
              <div className="space-y-2">
                <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3">
                  <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">CANDIDATE</div>
                  <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px]">{vendor.name}</div>
                </div>
                {vendor.githubUrl && (
                  <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3">
                    <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">SMOKING GUN</div>
                    <div className="font-mono text-[9px] text-[#00ff41] truncate">{vendor.githubUrl}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3">
                    <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">TOPOLOGY</div>
                    <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px]">—</div>
                  </div>
                  <div className="bg-[#10131a] border border-[#1a1f26]/60 p-3">
                    <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">THROUGHPUT</div>
                    <div className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] text-[11px]">—</div>
                  </div>
                </div>
                <div className="bg-[#10131a] border border-[#00ff41]/20 p-3">
                  <div className="font-mono text-[8px] text-[#84967e] uppercase mb-1">DOMAIN</div>
                  <div className="font-['Space_Grotesk'] font-bold text-[#00ff41] text-[11px]">Awaiting Input</div>
                </div>
              </div>
            )}
          </div>

          {/* Target artifact */}
          {phase !== 'idle' && (
            <div className="px-5 py-4 border-t border-[#1a1f26]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] text-[#84967e] uppercase">TARGET ARTIFACT</span>
                <span className="material-symbols-outlined text-[12px] text-[#84967e]">code</span>
              </div>
              <div className="bg-[#10131a] border border-[#1a1f26]/40 p-2 font-mono text-[9px] text-[#84967e]">
                <div>type HuntingPrompt = {'{'}</div>
                <div className="pl-3">role: "System Architect",</div>
                <div className="pl-3">task: "State Machine Design",</div>
                <div className="pl-3">{'constraints: Array<Condition>,'}</div>
                <div className="pl-3">evaluation_matrix: Metrics</div>
                <div>{'}'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settlement success toast */}
      {isSettled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 bg-[#191c22] p-5 border border-[#00ff41]/40 shadow-[0_0_40px_rgba(0,255,65,0.2)] z-[100] max-w-xs"
          style={{ borderRadius: '0px' }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-2 w-2 bg-[#00ff41] animate-pulse" />
            <span className="font-['Space_Grotesk'] font-bold text-[#00ff41] text-[11px] uppercase tracking-widest">Candidate Selected</span>
          </div>
          <p className="font-mono text-[9px] text-[#84967e] mb-3">Candidate hired. Team notified for onboarding.</p>
          <button
            onClick={resetAll}
            className="w-full py-2 bg-[#1d2026] hover:bg-[#272a31] border border-[#3b4b37] font-['Space_Grotesk'] font-bold text-[10px] uppercase text-[#e1e2eb] transition-colors"
            style={{ borderRadius: '0px' }}
          >
            DISPATCH NEW AGENT
          </button>
        </motion.div>
      )}
    </div>
  );
}
