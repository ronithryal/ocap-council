'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EscrowButton } from '@/components/wallet/EscrowButton';
import { Vendor } from '@/types';
import { Link2, Globe, ExternalLink, Award, FileCheck, Verified } from 'lucide-react';

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
      <Card className="bg-[#191c22] border-[#00ff41]/20 overflow-hidden relative" style={{ borderRadius: '0px' }}>
        {/* Header - Recommendation Banner */}
        <div className="bg-[#00ff41]/5 border-b border-[#00ff41]/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#00ff41]/10 border border-[#00ff41]/20 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-[#00ff41]" style={{ fontVariationSettings: "'FILL' 1" }} />
            </div>
            <div>
              <span className="font-['Space_Grotesk'] font-bold tracking-tight uppercase text-sm text-[#e1e2eb]">Council Recommendation</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-[#00ff41]"></span>
                <span className="text-[10px] font-mono text-[#00ff41] uppercase tracking-widest">RECOMMENDATION: HIRE</span>
              </div>
            </div>
          </div>
          <Badge className="bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/30 font-mono text-[10px] uppercase px-3 py-1">
            98% Match
          </Badge>
        </div>

        {/* Main Content */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left - Vendor Info */}
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-3xl font-['Space_Grotesk'] font-black tracking-tighter uppercase mb-1 text-[#e1e2eb]">
                  {vendor.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00ff41] text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  <p className="text-xs text-[#00ff41] font-mono font-bold tracking-widest uppercase">Verified Candidate</p>
                </div>
              </div>

              {/* Summary Quote */}
              <div className="p-4 bg-[#0b0e14] border-l-2 border-[#00ff41]/30">
                <p className="text-sm text-[#e1e2eb]/80 italic leading-relaxed font-mono">
                  "{vendor.summary}"
                </p>
              </div>

              {/* Credentials */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-['Space_Grotesk'] text-[#84967e] uppercase tracking-widest">Credentials</h4>
                <p className="text-sm text-[#b9ccb2] font-mono">{vendor.credentials}</p>
              </div>

              {/* Social Links */}
              <div className="flex gap-4">
                {vendor.linkedinUrl && (
                  <a href={vendor.linkedinUrl} target="_blank" className="text-[#84967e] hover:text-[#00ff41] transition-colors flex items-center gap-1 text-xs font-mono">
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    LinkedIn
                  </a>
                )}
                {vendor.githubUrl && (
                  <a href={vendor.githubUrl} target="_blank" className="text-[#84967e] hover:text-[#00ff41] transition-colors flex items-center gap-1 text-xs font-mono">
                    <span className="material-symbols-outlined text-[16px]">code</span>
                    GitHub
                  </a>
                )}
                {vendor.websiteUrl && (
                  <a href={vendor.websiteUrl} target="_blank" className="text-[#84967e] hover:text-[#00ff41] transition-colors flex items-center gap-1 text-xs font-mono">
                    <Globe className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block bg-[#3b4b37] h-auto" />

            {/* Right - Quote & CTA */}
            <div className="w-full md:w-80 space-y-6">
              {/* Quote Box */}
              <div className="p-6 bg-[#0b0e14] border border-[#3b4b37]/30 space-y-4 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00ff41]/5 rounded-full blur-[60px] pointer-events-none" />
                
                <div className="flex justify-between items-end relative z-10">
                   <span className="text-[10px] font-mono text-[#84967e] uppercase tracking-widest">Candidate Rate</span>
                   <span className="text-4xl font-['Space_Grotesk'] font-black tracking-tighter text-[#e1e2eb]">
                     ${vendor.quoteAmount.toLocaleString()}
                   </span>
                </div>
                
                {/* Verification Badge */}
                <div className="flex items-center gap-2 text-[10px] text-[#00ff41] font-mono uppercase bg-[#00ff41]/5 p-3 border border-[#00ff41]/10">
                  <Award className="h-3 w-3" />
                  Verified via Grit Analysis
                </div>

                {/* Escrow CTA */}
                <EscrowButton 
                  amount={vendor.quoteAmount} 
                  bountyId={vendor.bountyId}
                  onSuccess={onSettled} 
                />
              </div>
              
              <p className="text-[10px] text-[#84967e] text-center font-mono">
                Payment terms handled directly with candidate
              </p>
            </div>
          </div>
        </div>

        {/* Scanline Decoration */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] opacity-5" />
      </Card>
    </motion.div>
  );
}
