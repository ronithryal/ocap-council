'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BountyInput } from '@/components/bounty/BountyInput';
import { HydrationChat } from '@/components/bounty/HydrationChat';
import { AgentTracker } from '@/components/tracker/AgentTracker';
import { QuoteCard } from '@/components/settlement/QuoteCard';
import { ForensicDashboard } from '@/components/forensic/ForensicDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentPhase, Vendor, ForensicScore } from '@/types';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();
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
        body: JSON.stringify({
          vendorId: vendor.id,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Forensic analysis failed');
      }
      
      const data = await res.json();
      setForensicReport(data.score);
      setLogs(prev => [...prev, { 
        message: `Forensic Analysis complete. Grit Score: ${data.score.gritScore}/10. Call: ${data.score.recommendation}` 
      }]);
      setPhase('quote_received');
    } catch (err: any) {
      console.error('Forensic analysis error:', err);
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
      // 1. Create the bounty in Supabase
      const createRes = await fetch('/api/bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: finalPrompt,
          title: finalPrompt.split('\n')[0].substring(0, 50),
          budget: 500,
          category: 'Procurement',
        }),
      });

      if (!createRes.ok) {
        throw new Error('Failed to create bounty');
      }

      const bounty = await createRes.json();
      setBountyId(bounty.id);

      // 2. Update UI: navigating
      setPhase('navigating');
      setLogs(prev => [...prev, { message: 'Bounty created. Dispatching Perplexity Computer Agent...' }]);

      // 3. Dispatch the live agent
      const dispatchRes = await fetch(`/api/bounty/${bounty.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!dispatchRes.ok) {
        const errData = await dispatchRes.json();
        throw new Error(errData.error || 'Agent dispatch failed');
      }

      const result = await dispatchRes.json();

      // 4. Process the result
      setPhase('quote_received');
      setLogs(prev => [...prev, {
        message: `Council Recommendation ready: ${result.vendor?.name || 'Vendor found'} — $${result.vendor?.quoteAmount || '?'}`,
      }]);

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
      console.error('Dispatch error:', err);
      setPhase('failed');
      setError(err.message);
      setLogs(prev => [...prev, { message: `ERROR: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 font-['Inter']">
      {/* Hero / Branding */}
      <section className="text-center space-y-4 pt-8">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl font-['Space_Grotesk'] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#e1e2eb] via-[#e1e2eb] to-[#00ff41]"
        >
          ON-CHAIN AGENTIC PROCUREMENT
        </motion.h1>
        <p className="text-[#b9ccb2] font-mono tracking-widest text-xs uppercase">
          Powered by Perplexity Computer Agent · Forensic Code Analysis
        </p>
      </section>

      {/* Main Logic Flow */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
          <div className="xl:col-span-12 space-y-12">
            {/* Portal View */}
            {phase === 'idle' && (
              <BountyInput onDispatch={startHydration} isLoading={isLoading} />
            )}

            {phase === 'hydrating' && (
              <HydrationChat 
                initialPrompt={initialPrompt} 
                onComplete={handleDispatch}
                onCancel={() => setPhase('idle')}
              />
            )}
          </div>

        {phase !== 'idle' && (
          <>
            <div className="xl:col-span-5">
               <AgentTracker currentPhase={phase} logs={logs} />
            </div>

            <div className="xl:col-span-7 h-full">
               <AnimatePresence mode="wait">
                 {forensicReport ? (
                   /* Forensic Dashboard - Show Grit Score Analysis */
                   <motion.div
                     key="forensic-dashboard"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                   >
                     <ForensicDashboard
                       report={forensicReport}
                       developerHandle={vendor?.name || 'Unknown'}
                       smokingGunUrl={vendor?.githubUrl || ''}
                       onHireForTrial={() => setIsSettled(true)}
                       onDoNotHire={() => {
                         setForensicReport(null);
                         setVendor(null);
                         setPhase('idle');
                       }}
                     />
                   </motion.div>
                 ) : vendor && !forensicReport ? (
                   /* Quote Card with "Run Forensic Analysis" option */
                   <motion.div
                     key="quote-card"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-4"
                   >
                     <QuoteCard 
                       vendor={vendor} 
                       onSettled={(hash) => setIsSettled(true)} 
                     />
                     
                     {/* Run Forensic Analysis Button */}
                     <Card className="bg-[#191c22] border-[#00ff41]/20 p-6 flex items-center justify-between" style={{ borderRadius: '0px' }}>
                       <div className="flex items-center gap-4">
                         <div className="h-12 w-12 bg-[#00ff41]/10 border border-[#00ff41]/20 flex items-center justify-center">
                           <span className="material-symbols-outlined text-[#00ff41]" style={{ fontVariationSettings: "'FILL' 1" }}>
                             biotech
                           </span>
                         </div>
                         <div>
                           <h3 className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] uppercase">
                             Run Forensic Analysis
                           </h3>
                           <p className="text-xs text-[#b9ccb2] font-mono">
                             Pull raw diff, evaluate Grit vs AI-Slop
                           </p>
                         </div>
                       </div>
                       <Button
                         onClick={runForensicAnalysis}
                         disabled={isForensicLoading}
                         className="bg-[#00ff41] hover:bg-[#72ff70] text-[#003907] font-['Space_Grotesk'] font-bold h-12 px-6 shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all"
                         style={{ borderRadius: '0px' }}
                       >
                         {isForensicLoading ? (
                           <>
                             <div className="h-4 w-4 border-2 border-[#003907]/30 border-t-[#003907] rounded-full animate-spin mr-2" />
                             ANALYZING...
                           </>
                         ) : (
                           <>
                             <span className="material-symbols-outlined text-[16px] mr-2">analytics</span>
                             ANALYZE GRIT
                           </>
                         )}
                       </Button>
                     </Card>
                   </motion.div>
                 ) : phase === 'failed' ? (
                   <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[500px] border border-[#ffb4ab]/20 bg-[#93000a]/5 flex flex-col items-center justify-center p-12 text-center"
                    style={{ borderRadius: '0px' }}
                   >
                     <div className="h-20 w-20 rounded-none border border-[#ffb4ab]/20 flex items-center justify-center mb-6">
                        <span className="text-4xl text-[#ffb4ab]">!</span>
                     </div>
                     <h3 className="text-xl font-['Space_Grotesk'] font-bold mb-2 text-[#ffb4ab]">Agent Dispatch Failed</h3>
                     <p className="text-sm text-[#b9ccb2] font-mono max-w-sm mb-6">
                       {error || 'An unknown error occurred during the agentic workflow.'}
                     </p>
                     <button 
                       onClick={() => { setPhase('idle'); setError(null); setLogs([]); }}
                       className="px-6 py-2 bg-[#1d2026] hover:bg-[#272a31] text-[#e1e2eb] text-xs font-['Space_Grotesk'] font-bold transition-all border border-[#3b4b37]"
                       style={{ borderRadius: '0px' }}
                     >
                       TRY AGAIN
                     </button>
                   </motion.div>
                 ) : (
                   <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[500px] border border-[#3b4b37]/30 bg-[#191c22] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden"
                    style={{ borderRadius: '0px' }}
                   >
                     {/* Ambient Glow */}
                     <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,255,65,0.1),transparent_70%)] pointer-events-none" />
                     
                     <div className="h-20 w-20 rounded-none border border-[#00ff41]/20 flex items-center justify-center mb-6 relative">
                        <div className="h-10 w-10 border-4 border-[#00ff41] border-t-transparent rounded-none animate-spin" />
                     </div>
                     <h3 className="text-xl font-['Space_Grotesk'] font-bold mb-2 text-[#e1e2eb]">Perplexity Computer Agent Active</h3>
                     <p className="text-sm text-[#b9ccb2] font-mono max-w-sm relative">
                       The agent is autonomously navigating the web to find, vet, and recommend the best vendor for your requirements. This may take 30-60 seconds.
                     </p>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Settlement Success Banner */}
      {isSettled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-12 right-12 bg-[#191c22] p-6 border border-[#00ff41]/40 shadow-[0_0_50px_rgba(0,255,65,0.3)] z-[100] max-w-sm"
          style={{ borderRadius: '0px' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-3 w-3 rounded-full bg-[#00ff41] animate-pulse"></div>
            <h4 className="font-['Space_Grotesk'] font-bold text-[#00ff41] uppercase tracking-tighter">Candidate Selected</h4>
          </div>
          <p className="text-xs text-[#e1e2eb]/70 font-mono mb-4">
            Candidate hired. Team notified for onboarding.
          </p>
          <button 
            onClick={() => { setPhase('idle'); setVendor(null); setForensicReport(null); setIsSettled(false); setLogs([]); setBountyId(null); }}
            className="w-full py-2 bg-[#1d2026] hover:bg-[#272a31] text-xs font-['Space_Grotesk'] font-bold transition-all border border-[#3b4b37]"
            style={{ borderRadius: '0px' }}
          >
            DISPATCH NEW AGENT
          </button>
        </motion.div>
      )}
    </div>
  );
}
