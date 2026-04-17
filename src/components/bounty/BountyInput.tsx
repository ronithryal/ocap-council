'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Zap, Shield, Search } from 'lucide-react';
import { useAccount } from 'wagmi';

interface BountyInputProps {
  onDispatch: (data: any) => void;
  isLoading: boolean;
}

export function BountyInput({ onDispatch, isLoading }: BountyInputProps) {
  const { address } = useAccount();
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('500');

  const handleSubmit = () => {
    if (!description) return;
    onDispatch({
      title: description.split('\n')[0].substring(0, 50),
      description,
      budget: parseFloat(budget),
      category: 'Procurement',
      userId: address || 'anon',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card p-8 border-blue-500/20 max-w-3xl mx-auto overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4">
          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/10">
            GPT-4 | SONAR-PRO
          </Badge>
        </div>

        <div className="mb-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <Search className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Agent Dispatch Portal</h2>
            <p className="text-sm text-muted-foreground font-mono">Input your procurement requirements below.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <Textarea
              placeholder="e.g., I need a high-end videographer in SF for a 2-day shoot. Must have at least 5 years experience and provide a portfolio link. Budget is strict."
              className="min-h-[120px] bg-black/40 border-white/10 focus:border-blue-500/50 transition-all resize-none font-mono text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
               <span className="text-[10px] text-white/20 font-mono tracking-widest uppercase">Input hydrated via Brockman Formula</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Budget (USDC)</label>
              <Input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="bg-black/40 border-white/10 focus:border-blue-500/50" 
              />
            </div>
            
            <Button 
              size="lg"
              disabled={isLoading || !description}
              onClick={handleSubmit}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 px-8"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  DISPATCH AGENT
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Decorative scanline effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] opacity-10" />
      </Card>
    </motion.div>
  );
}
