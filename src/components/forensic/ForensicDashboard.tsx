'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ForensicScore } from '@/types';

interface ForensicDashboardProps {
  report: ForensicScore;
  developerHandle: string;
  smokingGunUrl: string;
  onHireForTrial?: () => void;
  onDoNotHire?: () => void;
}

// GritHunter Forensic Design Tokens - Colors
const COLORS = {
  primary: '#00FF41',        // Grit Green - positive markers
  primaryDim: '#72FF70',     // Bright accent
  secondary: '#FEB700',       // Warning Amber - AI-slop flags
  secondaryDim: '#FFBA20',   // Secondary accent
  surface: '#10131A',         // Base surface
  surfaceLow: '#191C22',      // Container low
  surfaceHigh: '#272A31',     // Container high
  surfaceHighest: '#32353C',  // Container highest
  surfaceLowest: '#0B0E14',   // Deepest background
  outline: '#84967E',         // Subtle borders
  outlineVariant: '#3B4B37',  // Ghost borders
  onSurface: '#E1E2EB',       // Primary text
  onSurfaceVariant: '#B9CCB2', // Secondary text
  error: '#FFB4AB',           // Error red
  errorContainer: '#93000A',  // Error background
};

const ARCHETYPE_CONFIG = {
  'Concurrency Master': { bg: 'bg-[#00ff41]/10', border: 'border-[#00ff41]/30', text: 'text-[#00ff41]' },
  'State Architect': { bg: 'bg-[#00b4d8]/10', border: 'border-[#00b4d8]/30', text: 'text-[#00b4d8]' },
  'Chaos Engineer': { bg: 'bg-[#ff9f1c]/10', border: 'border-[#ff9f1c]/30', text: 'text-[#ff9f1c]' },
  'Generalist': { bg: 'bg-[#2ec4b6]/10', border: 'border-[#2ec4b6]/30', text: 'text-[#2ec4b6]' },
  'Uncategorized': { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/40' },
};

const RECOMMENDATION_CONFIG = {
  HIRE_FOR_TRIAL: {
    label: 'RECOMMENDATION: HIRE',
    color: 'bg-[#00ff41]/10 border-[#00ff41]/30 text-[#00ff41]',
    icon: 'check_circle',
    description: 'Clears the grit threshold. Ready for $2k atomic trial.',
  },
  NEEDS_HUMAN_REVIEW: {
    label: 'RECOMMENDATION: REVIEW',
    color: 'bg-[#feb700]/10 border-[#feb700]/30 text-[#feb700]',
    icon: 'help',
    description: 'Interesting signals but insufficient evidence to authorize spend.',
  },
  DO_NOT_HIRE: {
    label: 'RECOMMENDATION: REJECT',
    color: 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]',
    icon: 'cancel',
    description: 'Below grit threshold. AI-slop or insufficient engineering depth.',
  },
};

const DIMENSION_LABELS = {
  edgeCaseDensity: 'Edge Case Density',
  architecturalIntent: 'Architectural Intent',
  codeFingerprint: 'Code Fingerprint',
  testingRigor: 'Testing Rigor',
};

export function ForensicDashboard({
  report,
  developerHandle,
  smokingGunUrl,
  onHireForTrial,
  onDoNotHire,
}: ForensicDashboardProps) {
  const recConfig = RECOMMENDATION_CONFIG[report.recommendation];
  const archetypeConfig = ARCHETYPE_CONFIG[report.archetype] || ARCHETYPE_CONFIG['Uncategorized'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Inter']">
      {/* Header - Grit Score & Developer Info */}
      <div className="flex items-center justify-between border-b border-[#3b4b37]/30 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[#00ff41]"></span>
            <span className="font-mono text-[10px] text-[#b9ccb2] uppercase tracking-widest">
              TARGET_REPO_
            </span>
          </div>
          <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tighter uppercase text-[#e1e2eb]">
            {developerHandle}
          </h2>
          <a
            href={smokingGunUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-[#b9ccb2]/60 hover:text-[#00ff41] transition-colors"
          >
            {smokingGunUrl}
          </a>
        </div>
        <div className="flex items-center gap-6">
          <Badge className={`${archetypeConfig.bg} ${archetypeConfig.border} ${archetypeConfig.text} border px-3 py-1 text-[10px] font-['Space_Grotesk'] uppercase tracking-widest`}>
            {report.archetype}
          </Badge>
          <div className="text-right">
            <div className="font-['Space_Grotesk'] text-4xl font-black tracking-tighter text-[#e1e2eb]">
              {report.gritScore}<span className="text-2xl text-[#84967e]">/10</span>
            </div>
            <div className="text-[10px] text-[#84967e] font-mono uppercase tracking-widest">Grit Score</div>
          </div>
        </div>
      </div>

      {/* Recommendation Banner - The "Surgical Authoritative Box" */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border p-4 relative overflow-hidden ${recConfig.color}`}
        style={{ boxShadow: '0 0 40px rgba(0,255,65,0.15)' }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-[#00ff41]/20 to-transparent pointer-events-none opacity-50"></div>
        <div className="flex items-center gap-4 relative z-10">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {recConfig.icon === 'check_circle' ? 'check_circle' : recConfig.icon === 'help' ? 'help' : 'cancel'}
          </span>
          <div>
            <div className="font-['Space_Grotesk'] font-black text-xl uppercase tracking-tight">{recConfig.label}</div>
            <div className="text-sm text-[#e1e2eb]/60">{recConfig.description}</div>
          </div>
        </div>
      </motion.div>

      {/* Dimensions Grid - Rigid Geometric Data Rep */}
      <div className="grid grid-cols-2 gap-4">
        {(Object.entries(DIMENSION_LABELS) as [keyof typeof report.dimensions, string][]).map(([key, label]) => {
          const score = report.dimensions[key];
          return (
            <Card key={key} className="bg-[#191c22] border-[#3b4b37]/20 p-4 relative surgical-hover-trace group">
              <div className="flex items-center justify-between mb-3 border-b border-[#3b4b37]/30 pb-2">
                <span className="text-[10px] font-['Space_Grotesk'] text-[#b9ccb2] uppercase tracking-widest">{label}</span>
                <span className="font-mono font-bold text-[#e1e2eb]">{score}<span className="text-[#84967e]">/10</span></span>
              </div>
              {/* Blocky Progress Bar */}
              <div className="h-2 bg-[#272a31] border border-[#3b4b37]/30 flex">
                <div 
                  className={`h-full transition-all ${
                    score >= 7 ? 'bg-[#00ff41]' : score >= 4 ? 'bg-[#feb700]' : 'bg-[#ffb4ab]'
                  }`}
                  style={{ width: `${score * 10}%` }}
                >
                  <div className="absolute right-0 top-0 h-full w-1 bg-[#0b0e14]"></div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Grit Markers - Positive Signals */}
      {report.gritMarkers.length > 0 && (
        <Card className="bg-[#191c22] border-[#00ff41]/20 p-4 relative">
          <h3 className="text-[10px] font-['Space_Grotesk'] text-[#00ff41] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">memory</span>
            Grit_Markers
          </h3>
          <ul className="space-y-3">
            {report.gritMarkers.map((marker, i) => (
              <li key={i} className="text-sm font-mono text-[#e1e2eb]/80 flex items-start gap-3 p-2 border border-transparent hover:border-[#00ff41]/20 hover:bg-[#1d2026] transition-colors technical-trace">
                <span className="text-[#00ff41] font-bold mt-0.5">+</span>
                {marker}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Red Flags - AI-Slop Warnings */}
      {report.redFlags.length > 0 && (
        <Card className="bg-[#191c22] border-[#feb700]/20 p-4 relative">
          <h3 className="text-[10px] font-['Space_Grotesk'] text-[#ffba20] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            AI_Slop_Flags
          </h3>
          <ul className="space-y-3">
            {report.redFlags.map((flag, i) => (
              <li key={i} className="text-sm font-mono text-[#e1e2eb]/80 flex items-start gap-3 p-2 border border-transparent hover:border-[#feb700]/20 hover:bg-[#1d2026] transition-colors">
                <span className="text-[#ffb4ab] font-bold mt-0.5">!</span>
                {flag}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* CTO Justification - Terminal Style Data Feed */}
      <Card className="bg-[#0b0e14] border-[#3b4b37]/20 p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff41]/20"></div>
        <h3 className="text-[10px] font-mono text-[#84967e] uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          CTO_Justification
        </h3>
        <p className="text-sm font-mono text-[#e1e2eb]/90 leading-relaxed pl-4">{report.justification}</p>
      </Card>

      {/* Action Buttons - Forensic Precision */}
      {report.recommendation === 'HIRE_FOR_TRIAL' && (
        <div className="flex gap-4">
          <Button
            onClick={onHireForTrial}
            className="flex-1 bg-[#00ff41] hover:bg-[#72ff70] text-[#003907] font-['Space_Grotesk'] font-bold h-12 border-none shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all active:opacity-50"
            style={{ borderRadius: '0px' }}
          >
            HIRE FOR TRIAL — $2,000 USDC
          </Button>
          <Button
            onClick={onDoNotHire}
            variant="outline"
            className="border-[#3b4b37] text-[#84967e] hover:text-[#e1e2eb] hover:border-[#00ff41] h-12 font-['Space_Grotesk']"
            style={{ borderRadius: '0px' }}
          >
            DO NOT HIRE
          </Button>
        </div>
      )}
    </div>
  );
}
