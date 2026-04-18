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

const ARCHETYPE_COLORS = {
  'Concurrency Master': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  'State Architect': 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  'Chaos Engineer': 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  'Generalist': 'bg-green-500/10 border-green-500/30 text-green-400',
  'Uncategorized': 'bg-white/5 border-white/10 text-white/40',
};

const RECOMMENDATION_CONFIG = {
  HIRE_FOR_TRIAL: {
    label: 'HIRE FOR TRIAL',
    color: 'bg-green-500/20 border-green-500/40 text-green-400',
    icon: '✓',
    description: 'Clears the grit threshold. Ready for $2k atomic trial.',
  },
  NEEDS_HUMAN_REVIEW: {
    label: 'NEEDS HUMAN REVIEW',
    color: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    icon: '?',
    description: 'Interesting signals but insufficient evidence to authorize spend.',
  },
  DO_NOT_HIRE: {
    label: 'DO NOT HIRE',
    color: 'bg-red-500/20 border-red-500/40 text-red-400',
    icon: '✗',
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono text-white">
            {developerHandle}
          </h2>
          <a
            href={smokingGunUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400/60 hover:text-blue-400 font-mono underline underline-offset-2"
          >
            {smokingGunUrl} ↗
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={`${ARCHETYPE_COLORS[report.archetype]} border px-3 py-1 text-xs font-mono uppercase tracking-wider`}>
            {report.archetype}
          </Badge>
          <div className="text-right">
            <div className="text-4xl font-bold font-mono text-white">{report.gritScore}/10</div>
            <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Grit Score</div>
          </div>
        </div>
      </div>

      {/* Recommendation Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-xl p-4 ${recConfig.color}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{recConfig.icon}</span>
          <div>
            <div className="font-mono font-bold uppercase tracking-widest">{recConfig.label}</div>
            <div className="text-sm text-white/60">{recConfig.description}</div>
          </div>
        </div>
      </motion.div>

      {/* Dimensions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {(Object.entries(DIMENSION_LABELS) as [keyof typeof report.dimensions, string][]).map(([key, label]) => {
          const score = report.dimensions[key];
          return (
            <Card key={key} className="glass-card p-4 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-white/60 uppercase tracking-widest">{label}</span>
                <span className="font-mono font-bold text-white">{score}/10</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score * 10}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Grit Markers */}
      {report.gritMarkers.length > 0 && (
        <Card className="glass-card border-green-500/20 p-4">
          <h3 className="text-xs font-mono text-green-400/80 uppercase tracking-widest mb-3">Grit Markers</h3>
          <ul className="space-y-2">
            {report.gritMarkers.map((marker, i) => (
              <li key={i} className="text-sm font-mono text-white/80 flex items-start gap-2">
                <span className="text-green-400 font-bold">+</span>
                {marker}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Red Flags */}
      {report.redFlags.length > 0 && (
        <Card className="glass-card border-red-500/20 p-4">
          <h3 className="text-xs font-mono text-red-400/80 uppercase tracking-widest mb-3">Red Flags</h3>
          <ul className="space-y-2">
            {report.redFlags.map((flag, i) => (
              <li key={i} className="text-sm font-mono text-white/80 flex items-start gap-2">
                <span className="text-red-400 font-bold">!</span>
                {flag}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* CTO Justification */}
      <Card className="glass-card border-white/10 p-4">
        <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">CTO Justification</h3>
        <p className="text-sm font-mono text-white/90 leading-relaxed">{report.justification}</p>
      </Card>

      {/* Action Buttons */}
      {report.recommendation === 'HIRE_FOR_TRIAL' && (
        <div className="flex gap-4">
          <Button
            onClick={onHireForTrial}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl transition-all"
          >
            HIRE FOR TRIAL — $2,000 USDC
          </Button>
          <Button
            onClick={onDoNotHire}
            variant="outline"
            className="border-white/10 text-white/40 hover:text-white/60 h-12 rounded-xl"
          >
            DO NOT HIRE
          </Button>
        </div>
      )}
    </div>
  );
}