'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Zap, Search } from 'lucide-react';
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
      <Card className="bg-[#191c22] border-[#3b4b37]/20 p-8 max-w-3xl mx-auto overflow-hidden relative" style={{ borderRadius: '0px' }}>
        {/* Badge - Model Indicator */}
        <div className="absolute top-0 right-0 p-4">
          <Badge variant="outline" className="text-[10px] border-[#00ff41]/30 text-[#00ff41] bg-[#00ff41]/10 font-mono uppercase tracking-widest">
            SONAR-PRO
          </Badge>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-none bg-[#00ff41]/10 border border-[#00ff41]/20 flex items-center justify-center">
            <Search className="h-5 w-5 text-[#00ff41]" />
          </div>
          <div>
            <h2 className="text-xl font-['Space_Grotesk'] font-black tracking-tight uppercase">Agent Dispatch Portal</h2>
            <p className="text-sm text-[#b9ccb2] font-mono text-xs">Input your procurement requirements below.</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="relative group">
            <Textarea
              placeholder="e.g., I need a high-end videographer in SF for a 2-day shoot. Must have at least 5 years experience and provide a portfolio link. Budget is strict."
              className="min-h-[120px] bg-[#0b0e14] border-[#3b4b37]/20 focus:border-[#00ff41]/50 transition-all resize-none font-mono text-sm placeholder-[#84967e]/50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ borderRadius: '0px' }}
            />
            {/* Decorative scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] opacity-10" />
            {/* Hint text */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
               <span className="text-[10px] text-[#e1e2eb]/20 font-mono tracking-widest uppercase">Input hydrated via Brockman Formula</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[10px] font-['Space_Grotesk'] font-bold text-[#84967e] uppercase tracking-widest px-1">Budget (USDC)</label>
              <Input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="bg-[#0b0e14] border-[#3b4b37]/20 focus:border-[#00ff41]/50 font-mono" 
                style={{ borderRadius: '0px' }}
              />
            </div>
            
            <Button 
              size="lg"
              disabled={isLoading || !description}
              onClick={handleSubmit}
              className="w-full md:w-auto bg-[#00ff41] hover:bg-[#72ff70] text-[#003907] font-['Space_Grotesk'] font-bold h-12 shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all flex items-center gap-2 px-8 border-none"
              style={{ borderRadius: '0px' }}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-[#003907]/30 border-t-[#003907] rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  DISPATCH AGENT
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Decorative Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] opacity-10" />
        
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#00ff41]/5 rounded-full blur-[80px] pointer-events-none" />
      </Card>
    </motion.div>
  );
}
