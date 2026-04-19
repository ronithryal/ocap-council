'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ForensicDashboard } from '@/components/forensic/ForensicDashboard';
import type { ForensicScore } from '@/types';

// Mock data for demo - in production this would fetch from Supabase
const MOCK_REPORTS = [
  {
    id: '1',
    developerHandle: 'rustacean-dev',
    smokingGunUrl: 'https://github.com/rustacean-dev/core-engine/pull/1234',
    gritScore: 8.7,
    archetype: 'Concurrency Master',
    recommendation: 'HIRE_FOR_TRIAL' as const,
    createdAt: '2026-04-18T10:30:00Z',
  },
  {
    id: '2',
    developerHandle: 'async-architect',
    smokingGunUrl: 'https://github.com/async-architect/distributed-system/pull/567',
    gritScore: 7.2,
    archetype: 'State Architect',
    recommendation: 'NEEDS_HUMAN_REVIEW' as const,
    createdAt: '2026-04-17T15:45:00Z',
  },
  {
    id: '3',
    developerHandle: 'suspicious-coder',
    smokingGunUrl: 'https://github.com/suspicious-coder/quick-fix/pull/999',
    gritScore: 3.4,
    archetype: 'Uncategorized',
    recommendation: 'DO_NOT_HIRE' as const,
    createdAt: '2026-04-16T09:20:00Z',
  },
];

export default function AuditPage() {
  const [selectedReport, setSelectedReport] = useState<typeof MOCK_REPORTS[0] | null>(null);
  const [reports] = useState(MOCK_REPORTS);

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE_FOR_TRIAL':
        return <Badge className="bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/30 font-mono text-[10px]">HIRE</Badge>;
      case 'NEEDS_HUMAN_REVIEW':
        return <Badge className="bg-[#feb700]/10 text-[#feb700] border-[#feb700]/30 font-mono text-[10px]">REVIEW</Badge>;
      case 'DO_NOT_HIRE':
        return <Badge className="bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30 font-mono text-[10px]">REJECT</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-64 right-0 h-12 bg-[#0b0e14]/90 backdrop-blur-md border-b border-[#1a1f26] flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <span className="font-['Space_Grotesk'] font-bold text-[#00ff41]">CONSOLE_ALPHA</span>
          <span className="text-[#84967e] font-mono text-[10px]">||</span>
          <span className="font-mono text-[#b9ccb2] text-[11px]">AUDIT_HISTORY</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 pt-12 p-10 min-h-screen">
        {/* Page Header */}
        <div className="mb-8 border-b border-[#3b4b37]/30 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 bg-[#00ff41]"></span>
            <span className="font-mono text-xs text-[#b9ccb2] uppercase tracking-widest">System Status</span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-4xl font-black tracking-tighter uppercase text-[#e1e2eb]">
            Audit History
          </h1>
          <p className="text-sm text-[#84967e] font-mono mt-2">
            Forensic analysis reports from past bounty hunts
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Report List */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-['Space_Grotesk'] text-[#84967e] uppercase tracking-widest mb-4">
              Past Analyses ({reports.length})
            </h2>
            
            {reports.map((report) => (
              <Card 
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`bg-[#191c22] border-[#3b4b37]/20 p-4 cursor-pointer transition-all hover:border-[#00ff41]/30 ${
                  selectedReport?.id === report.id ? 'border-[#00ff41]/50 bg-[#00ff41]/5' : ''
                }`}
                style={{ borderRadius: '0px' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#e1e2eb] uppercase">
                      {report.developerHandle}
                    </h3>
                    <p className="text-[10px] text-[#84967e] font-mono mt-1">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getRecommendationBadge(report.recommendation)}
                    <span className="text-2xl font-['Space_Grotesk'] font-black text-[#e1e2eb]">
                      {report.gritScore}<span className="text-sm text-[#84967e]">/10</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] border-[#00b4d8]/30 text-[#00b4d8] bg-[#00b4d8]/5 font-mono">
                    {report.archetype}
                  </Badge>
                </div>
                
                <a 
                  href={report.smokingGunUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#84967e] hover:text-[#00ff41] font-mono transition-colors block truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {report.smokingGunUrl}
                </a>
              </Card>
            ))}
          </div>

          {/* Right: Report Detail */}
          <div>
            <h2 className="text-[10px] font-['Space_Grotesk'] text-[#84967e] uppercase tracking-widest mb-4">
              Report Detail
            </h2>
            
            {selectedReport ? (
              <Card className="bg-[#191c22] border-[#3b4b37]/20 p-6" style={{ borderRadius: '0px' }}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#3b4b37]/30">
                  <div>
                    <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#e1e2eb] uppercase">
                      {selectedReport.developerHandle}
                    </h3>
                    <p className="text-xs text-[#84967e] font-mono mt-1">
                      {selectedReport.smokingGunUrl}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-['Space_Grotesk'] font-black text-[#e1e2eb]">
                      {selectedReport.gritScore}
                      <span className="text-2xl text-[#84967e]">/10</span>
                    </div>
                    <p className="text-[10px] text-[#84967e] font-mono uppercase mt-1">Grit Score</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-['Space_Grotesk'] text-[#84967e] uppercase tracking-widest">
                      Archetype
                    </span>
                    <p className="text-sm text-[#e1e2eb] font-mono mt-1">
                      {selectedReport.archetype}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-['Space_Grotesk'] text-[#84967e] uppercase tracking-widest">
                      Recommendation
                    </span>
                    <div className="mt-2">
                      {getRecommendationBadge(selectedReport.recommendation)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-['Space_Grotesk'] text-[#84967e] uppercase tracking-widest">
                      Analyzed On
                    </span>
                    <p className="text-sm text-[#e1e2eb] font-mono mt-1">
                      {formatDate(selectedReport.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-[#3b4b37]/30">
                  <a 
                    href={selectedReport.smokingGunUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff41]/10 border border-[#00ff41]/20 text-[#00ff41] hover:bg-[#00ff41]/20 transition-colors font-['Space_Grotesk'] text-xs font-bold uppercase"
                    style={{ borderRadius: '0px' }}
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    View Original PR
                  </a>
                </div>
              </Card>
            ) : (
              <Card className="bg-[#191c22] border-[#3b4b37]/20 p-12 flex flex-col items-center justify-center" style={{ borderRadius: '0px' }}>
                <span className="material-symbols-outlined text-4xl text-[#84967e] mb-4">description</span>
                <p className="text-sm text-[#84967e] font-mono text-center">
                  Select a report from the list to view details
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
