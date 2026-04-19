'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentPhase, AgentStatus } from '@/types';
import { cn } from '@/lib/utils';

const phases: { phase: AgentPhase; label: string; icon: string; status: 'pending' | 'active' | 'complete' }[] = [
  { phase: 'dispatching', label: 'Hydrating Prompt', icon: 'smart_toy', status: 'pending' },
  { phase: 'navigating', label: 'Perplexity Web Search', icon: 'radar', status: 'pending' },
  { phase: 'vetting', label: 'Credential Analysis', icon: 'shield', status: 'pending' },
  { phase: 'awaiting_quote', label: 'Quote Generation', icon: 'request_quote', status: 'pending' },
  { phase: 'quote_received', label: 'Recommendation Ready', icon: 'check_circle', status: 'pending' },
  { phase: 'settling', label: 'On-Chain Settlement', icon: 'credit_card', status: 'pending' },
];

interface AgentTrackerProps {
  currentPhase: AgentPhase;
  logs: any[];
}

export function AgentTracker({ currentPhase, logs }: AgentTrackerProps) {
  const activeIndex = phases.findIndex(p => p.phase === currentPhase);

  // Update phase statuses based on current phase
  const updatedPhases = phases.map((p, index) => {
    if (index < activeIndex) return { ...p, status: 'complete' as const };
    if (index === activeIndex) return { ...p, status: 'active' as const };
    return { ...p, status: 'pending' as const };
  });

  return (
    <Card className="bg-[#191c22] border-[#3b4b37]/20 p-6 flex flex-col relative overflow-hidden" style={{ borderRadius: '0px' }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-[#3b4b37]/30 pb-4">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 bg-[#00ff41]/10 border border-[#00ff41]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00ff41] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                radar
              </span>
           </div>
           <div>
             <h3 className="font-['Space_Grotesk'] font-bold text-lg tracking-tight uppercase">Perplexity Computer Agent</h3>
             <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 bg-[#00ff41] animate-pulse"></span>
               <span className="text-[10px] font-mono text-[#00ff41] uppercase tracking-widest">SONAR-DEEP-RESEARCH</span>
             </div>
           </div>
        </div>
        <Badge className="bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/20 font-mono text-[10px] uppercase">
          ACTIVE
        </Badge>
      </div>

      {/* Phase Tracker */}
      <div className="space-y-4 flex-1">
        {updatedPhases.map((p, index) => {
          const isActive = p.status === 'active';
          const isCompleted = p.status === 'complete';
          const isPending = p.status === 'pending';

          return (
            <motion.div
              key={p.phase}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: isPending ? 0.4 : 1,
                x: 0,
                scale: isActive ? 1.02 : 1
              }}
              className="relative pl-10"
            >
              {/* Connector line */}
              {index < phases.length - 1 && (
                <div className={cn(
                  "absolute left-[15px] top-8 w-[2px] h-8 transition-colors duration-500",
                  isCompleted ? "bg-[#00ff41]/50" : "bg-[#3b4b37]"
                )} />
              )}

              {/* Icon / Status */}
              <div className={cn(
                "absolute left-0 top-0 h-10 w-10 border flex items-center justify-center transition-all duration-500",
                isActive ? "bg-[#00ff41] border-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.5)]" : 
                isCompleted ? "bg-[#00ff41]/10 border-[#00ff41]/30" : "bg-[#1d2026] border-[#3b4b37]"
              )}>
                {isActive ? (
                  <span className="material-symbols-outlined text-[#003907] animate-spin text-[18px]">
                    progress_activity
                  </span>
                ) : isCompleted ? (
                   <span className="material-symbols-outlined text-[#00ff41] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                   </span>
                ) : (
                  <span className={cn(
                    "material-symbols-outlined text-[18px]",
                    isPending ? "text-[#84967e]" : ""
                  )}>
                    {p.icon}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="flex flex-col gap-1">
                <span className={cn(
                  "text-xs font-['Space_Grotesk'] uppercase tracking-widest transition-colors",
                  isActive ? "text-[#00ff41] font-bold" : isCompleted ? "text-[#e1e2eb]/70" : "text-[#84967e]"
                )}>
                  Phase 0{index + 1}: {p.label}
                </span>
                
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-mono text-[#e1e2eb]/90 leading-relaxed"
                    >
                      {logs[logs.length - 1]?.message || `Executing ${p.label.toLowerCase()} sub-tasks...`}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Footer */}
      <div className="mt-6 pt-6 border-t border-[#3b4b37]/30">
         <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-[#84967e] uppercase">Compliance Progress</span>
            <span className="text-[10px] font-mono text-[#00ff41]">{(activeIndex + 1) * 16}%</span>
         </div>
         <div className="h-1 bg-[#272a31] border border-[#3b4b37]/30 relative overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(activeIndex + 1) * 16}%` }}
              className="h-full bg-[#00ff41] relative"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-[#0b0e14]"></div>
            </motion.div>
         </div>
      </div>

      {/* Ambient Glow Effect */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#00ff41]/10 rounded-full blur-[80px] pointer-events-none" />
    </Card>
  );
}
