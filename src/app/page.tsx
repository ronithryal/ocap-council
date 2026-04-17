'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BountyInput } from '@/components/bounty/BountyInput';
import { AgentTracker } from '@/components/tracker/AgentTracker';
import { QuoteCard } from '@/components/settlement/QuoteCard';
import { AgentPhase, BountyRequest, Vendor } from '@/types';
import { simulateAgentWorkflow } from '@/lib/mock/agent';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();
  const [bounty, setBounty] = useState<Partial<BountyRequest> | null>(null);
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [logs, setLogs] = useState<{ message: string }[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isSettled, setIsSettled] = useState(false);

  const handleDispatch = (data: any) => {
    setBounty(data);
    setPhase('dispatching');
    setVendor(null);
    setIsSettled(false);
    
    // Simulate the full agentic loop
    simulateAgentWorkflow(
      'mock-id',
      (newPhase, message) => {
        setPhase(newPhase);
        setLogs(prev => [...prev, { message }]);
      },
      (response) => {
        setVendor(response.findings.selectedVendor as Vendor);
      }
    );
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
          Empowering the B2B Economy with Council-Governed Agents
        </p>
      </section>

      {/* 2. Main Logic Flow */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        <div className="xl:col-span-12 space-y-12">
           {/* Portal View */}
           {phase === 'idle' && (
             <BountyInput onDispatch={handleDispatch} isLoading={false} />
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
                 ) : (
                   <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[500px] border border-white/5 bg-white/5 rounded-3xl flex flex-col items-center justify-center p-12 text-center"
                   >
                     <div className="h-20 w-20 rounded-full border border-blue-500/20 flex items-center justify-center mb-6">
                        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                     </div>
                     <h3 className="text-xl font-bold mb-2">Agent Vetting in Progress</h3>
                     <p className="text-sm text-muted-foreground font-mono max-w-sm">
                       The OCAP Council is currently navigating vendor networks to identify the highest tier match for your requirements.
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
            USDC Locked in escrow (TX Hash: 0x8a1...3f12). Vendor notified for mobilization.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg transition-all"
          >
            DISPATCH NEW AGENT
          </button>
        </motion.div>
      )}
    </div>
  );
}
