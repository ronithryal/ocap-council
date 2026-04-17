'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EscrowButton } from '@/components/wallet/EscrowButton';
import { Vendor } from '@/types';
import { Linkedin, Github, Globe, ExternalLink, Award, FileCheck } from 'lucide-react';

interface QuoteCardProps {
  vendor: Vendor;
  onSettled: (txHash: string) => void;
}

export function QuoteCard({ vendor, onSettled }: QuoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <Card className="glass-card border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)] overflow-hidden">
        <div className="bg-green-500/10 border-b border-green-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-green-400" />
            <span className="font-bold tracking-tight uppercase text-sm">Council Recommendation</span>
          </div>
          <Badge className="bg-green-600 text-white border-white/20">98% Match</Badge>
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-3xl font-bold tracking-tighter mb-1">{vendor.name}</h3>
                <p className="text-sm text-green-400 font-mono font-bold tracking-widest uppercase">Verified Candidate</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-white/70 italic leading-relaxed">
                  "{vendor.summary}"
                </p>
              </div>

              <div className="flex gap-4">
                {vendor.linkedinUrl && (
                  <a href={vendor.linkedinUrl} target="_blank" className="text-white/40 hover:text-blue-400 transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {vendor.githubUrl && (
                  <a href={vendor.githubUrl} target="_blank" className="text-white/40 hover:text-white transition-colors">
                    <Github className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block bg-white/5 h-auto" />

            <div className="w-full md:w-80 space-y-6">
              <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-mono text-muted-foreground uppercase">Fixed Quote</span>
                   <span className="text-4xl font-bold tracking-tighter">${vendor.quoteAmount.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-green-400/80 font-mono uppercase bg-green-500/5 p-2 rounded-lg border border-green-500/10">
                    <Award className="h-3 w-3" />
                    Hydrated with Global 2026 Compliance
                  </div>
                </div>

                <EscrowButton 
                  amount={vendor.quoteAmount} 
                  bountyId={vendor.bountyId}
                  onSuccess={onSettled} 
                />
              </div>
              
              <p className="text-[10px] text-muted-foreground text-center font-mono">
                Settled via USDC Escrow (on-chain)
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
