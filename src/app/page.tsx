'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BountyInput } from '@/components/bounty/BountyInput';
import { AgentTracker } from '@/components/tracker/AgentTracker';
import { QuoteCard } from '@/components/settlement/QuoteCard';
import { AgentPhase, Vendor } from '@/types';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [logs, setLogs] = useState<{ message: string }[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isSettled, setIsSettled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDispatch = async (data: any) => {
    setPhase('dispatching');
    setVendor(null);
    setIsSettled(false);
    setError(null);
    setIsLoading(true);
    setLogs([{ message: 'OCAP Council initialized. Submitting bounty...' }]);

    try {
      // 1. Create the bounty in Supabase
      const createRes = await fetch('/api/bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!createRes.ok) {
        throw new Error('Failed to create bounty');
      }

      const bounty = await createRes.json();

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
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* 1. Hero / Branding */}
      <section className="text-center space-y-4 pt-8">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-500"
        >
          ON-CHAIN AGENTIC PROCUREMENT
        </motion.h1>
        <p className="text-muted-foreground font-mono tracking-widest text-xs uppercase">
          Powered by Perplexity Computer Agent · Settled on Base via CDP
        </p>
      </section>

      {/* 2. Main Logic Flow */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        <div className="xl:col-span-12 space-y-12">
           {/* Portal View */}
           {phase === 'idle' && (
             <BountyInput onDispatch={handleDispatch} isLoading={isLoading} />
           )}
        </div>

        {phase !== 'idle' && (
          <>
            <div className="xl:col-span-5">
               <AgentTracker currentPhase={phase} logs={logs} />
            </div>

            <div className="xl:col-span-7 h-full">
               <AnimatePresence mode="wait">
                 {vendor ? (
                   <QuoteCard 
                    key="quote" 
                    vendor={vendor} 
                    onSettled={(hash) => setIsSettled(true)} 
                   />
                 ) : phase === 'failed' ? (
                   <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[500px] border border-red-500/20 bg-red-500/5 rounded-3xl flex flex-col items-center justify-center p-12 text-center"
                   >
                     <div className="h-20 w-20 rounded-full border border-red-500/20 flex items-center justify-center mb-6">
                        <span className="text-4xl">⚠</span>
                     </div>
                     <h3 className="text-xl font-bold mb-2 text-red-400">Agent Dispatch Failed</h3>
                     <p className="text-sm text-muted-foreground font-mono max-w-sm mb-6">
                       {error || 'An unknown error occurred during the agentic workflow.'}
                     </p>
                     <button 
                       onClick={() => { setPhase('idle'); setError(null); setLogs([]); }}
                       className="px-6 py-2 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg transition-all"
                     >
                       TRY AGAIN
                     </button>
                   </motion.div>
                 ) : (
                   <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[500px] border border-white/5 bg-white/5 rounded-3xl flex flex-col items-center justify-center p-12 text-center"
                   >
                     <div className="h-20 w-20 rounded-full border border-blue-500/20 flex items-center justify-center mb-6">
                        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                     </div>
                     <h3 className="text-xl font-bold mb-2">Perplexity Computer Agent Active</h3>
                     <p className="text-sm text-muted-foreground font-mono max-w-sm">
                       The agent is autonomously navigating the web to find, vet, and recommend the best vendor for your requirements. This may take 30-60 seconds.
                     </p>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {isSettled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-12 right-12 glass-card p-6 border-green-500/40 shadow-[0_0_50px_rgba(34,197,94,0.3)] z-[100] max-w-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <h4 className="font-bold text-green-400 uppercase tracking-tighter">Settlement Successful</h4>
          </div>
          <p className="text-xs text-white/70 font-mono mb-4">
            USDC Locked in escrow. Vendor notified for mobilization.
          </p>
          <button 
            onClick={() => { setPhase('idle'); setVendor(null); setIsSettled(false); setLogs([]); }}
            className="w-full py-2 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg transition-all"
          >
            DISPATCH NEW AGENT
          </button>
        </motion.div>
      )}
    </div>
  );
}
