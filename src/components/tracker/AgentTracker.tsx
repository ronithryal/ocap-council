'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentPhase, AgentStatus } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  Search, 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  CheckCircle2,
  Clock,
  Activity
} from 'lucide-react';

const phases: { phase: AgentPhase; label: string; icon: any; color: string }[] = [
  { phase: 'dispatching', label: 'Hydrating Prompt', icon: Clock, color: 'text-blue-400' },
  { phase: 'navigating', label: 'Perplexity Web Search', icon: Search, color: 'text-purple-400' },
  { phase: 'vetting', label: 'Credential Analysis', icon: ShieldCheck, color: 'text-cyan-400' },
  { phase: 'awaiting_quote', label: 'Quote Generation', icon: FileText, color: 'text-orange-400' },
  { phase: 'quote_received', label: 'Recommendation Ready', icon: CheckCircle2, color: 'text-green-400' },
  { phase: 'settling', label: 'On-Chain Settlement', icon: CreditCard, color: 'text-blue-500' },
];

interface AgentTrackerProps {
  currentPhase: AgentPhase;
  logs: any[];
}

export function AgentTracker({ currentPhase, logs }: AgentTrackerProps) {
  const activeIndex = phases.findIndex(p => p.phase === currentPhase);

  return (
    <Card className="glass-card p-8 border-blue-500/10 min-h-[500px] flex flex-col relative overflow-hidden">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
           </div>
           <h3 className="font-bold text-lg tracking-tight uppercase">Perplexity Computer Agent</h3>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] bg-green-500/5 text-green-400 border-green-500/20">
          SONAR-DEEP-RESEARCH
        </Badge>
      </div>

      <div className="space-y-8 flex-1">
        {phases.map((p, index) => {
          const Icon = p.icon;
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;

          return (
            <motion.div
              key={p.phase}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: isCompleted || isActive ? 1 : 0.3,
                x: 0,
                scale: isActive ? 1.02 : 1
              }}
              className="relative pl-10"
            >
              {/* Connector line */}
              {index < phases.length - 1 && (
                <div className={cn(
                  "absolute left-[15px] top-8 w-[2px] h-8 transition-colors duration-500",
                  isCompleted ? "bg-blue-500/50" : "bg-white/5"
                )} />
              )}

              {/* Icon / Status */}
              <div className={cn(
                "absolute left-0 top-0 h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-500",
                isActive ? "bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)]" : 
                isCompleted ? "bg-blue-900/40 border-blue-500/30" : "bg-white/5 border-white/10"
              )}>
                {isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : isCompleted ? (
                   <CheckCircle2 className="h-4 w-4 text-blue-400" />
                ) : (
                  <Icon className="h-4 w-4 text-white/20" />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-widest transition-colors",
                  isActive ? "text-blue-400" : isCompleted ? "text-white/70" : "text-white/20"
                )}>
                  Phase 0{index + 1}: {p.label}
                </span>
                
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-white font-mono leading-relaxed"
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

      <div className="mt-8 pt-8 border-t border-white/5">
         <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Compliance Progress</span>
            <span className="text-[10px] font-mono text-blue-400">{(activeIndex + 1) * 16}%</span>
         </div>
         <Progress value={(activeIndex + 1) * 16} className="h-1 bg-white/5" />
      </div>

      {/* Retro terminal ambient light */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
    </Card>
  );
}
