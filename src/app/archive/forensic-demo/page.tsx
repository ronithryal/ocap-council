'use client';

import { useState } from 'react';
import { ForensicDashboard } from '@/components/forensic/ForensicDashboard';
import { Sidebar } from '@/components/layout/Sidebar';
import type { ForensicScore } from '@/types';

// Mock data for demonstration
const MOCK_REPORT: ForensicScore = {
  gritScore: 8.7,
  archetype: 'Concurrency Master',
  dimensions: {
    edgeCaseDensity: 9.2,
    architecturalIntent: 8.4,
    codeFingerprint: 8.1,
    testingRigor: 8.9,
  },
  gritMarkers: [
    'Implemented lock-free data structures in high-throughput path',
    'Manual memory management with explicit lifetime annotations',
    'Complex async state machine with backpressure handling',
  ],
  redFlags: [
    'Single try-catch wrapping entire function body',
    'Magic numbers without named constants',
  ],
  justification: 'Strong concurrency patterns with evidence of deep systems thinking. The candidate demonstrates awareness of edge cases in distributed systems, particularly around race conditions and memory ordering. The testing coverage is above average for this seniority level. Minor concerns around error handling patterns can be addressed during onboarding.',
  recommendation: 'HIRE',
};

export default function ForensicDemo() {
  const [report] = useState<ForensicScore>(MOCK_REPORT);

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      <Sidebar />
      
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-64 right-0 h-12 bg-[#0b0e14]/90 backdrop-blur-md border-b border-[#1a1f26] flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <span className="font-['Space_Grotesk'] font-bold text-[#00ff41]">CONSOLE_ALPHA</span>
          <span className="text-[#84967e] font-mono text-[10px]">||</span>
          <span className="font-mono text-[#b9ccb2] text-[11px]">TARGET_ID: 994.X2</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center border-b border-[#3b4b37] w-48 opacity-50 hover:opacity-100 transition-opacity">
            <span className="font-mono text-[10px] text-[#84967e] pb-1">{" > "}QUERY_</span>
          </div>
          <div className="flex items-center gap-4 text-[#84967e]">
            <button className="hover:text-[#00ff41] transition-colors">
              <span className="material-symbols-outlined text-[18px]">security</span>
            </button>
            <button className="hover:text-[#00ff41] transition-colors">
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
            </button>
            <button className="hover:text-[#00ff41] transition-colors">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
            </button>
          </div>
          <button className="bg-[#191c22] text-[#00ff41] border border-[#3b4b37] px-3 py-1 font-mono text-[10px] uppercase hover:bg-[#00ff41]/10 transition-colors active:opacity-50">
            DECODE_DIFF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 pt-12 p-10 min-h-screen bg-[#0b0e14]">
        {/* Page Header */}
        <div className="mb-8 border-b border-[#3b4b37]/30 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 bg-[#00ff41]"></span>
            <span className="font-mono text-xs text-[#b9ccb2] uppercase tracking-widest">STATUS: ANALYSIS_COMPLETE</span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-4xl lg:text-5xl font-black tracking-tighter uppercase text-[#e1e2eb]">
            Diligence Report
          </h1>
          <div className="font-mono text-sm text-[#84967e] mt-2">
            HASH: 0x8F92A...B41C | RUNTIME: 0.44s
          </div>
        </div>

        {/* Dashboard */}
        <ForensicDashboard
          report={report}
          developerHandle="rustacean-dev"
          smokingGunUrl="https://github.com/rustacean-dev/core-engine/pull/1234"
          onHireForTrial={() => alert('Hiring for trial!')}
          onDoNotHire={() => alert('Not hiring')}
        />
      </main>
    </div>
  );
}
