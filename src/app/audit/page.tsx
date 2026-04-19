'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@supabase/ssr';

// Row shape returned from Supabase engineer_reports
interface ReportRow {
  id: string;
  developer_handle: string;
  smoking_gun_url: string | null;
  grit_score: number;
  archetype: string;
  recommendation: string;
  created_at: string;
}

export default function AuditPage() {
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function fetchReports() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('engineer_reports')
        .select('id, developer_handle, smoking_gun_url, grit_score, archetype, recommendation, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setReports(data ?? []);
      }
      setLoading(false);
    }

    fetchReports();
  }, []);

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
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
      minute: '2-digit',
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

        {/* Loading / Error states */}
        {loading && (
          <p className="font-mono text-[#84967e] text-sm animate-pulse">Loading reports…</p>
        )}
        {error && (
          <p className="font-mono text-[#ffb4ab] text-sm">Error: {error}</p>
        )}

        {/* Two Column Layout */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Report List */}
            <div className="space-y-4">
              <h2 className="text-[10px] font-['Space_Grotesk'] text-[#84967e] uppercase tracking-widest mb-4">
                Past Analyses ({reports.length})
              </h2>

              {reports.length === 0 && (
                <p className="font-mono text-[#84967e] text-sm">No reports yet. Run a bounty to generate one.</p>
              )}

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
                        {report.developer_handle}
                      </h3>
                      <p className="text-[10px] text-[#84967e] font-mono mt-1">
                        {formatDate(report.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getRecommendationBadge(report.recommendation)}
                      <span className="text-2xl font-['Space_Grotesk'] font-black text-[#e1e2eb]">
                        {report.grit_score}<span className="text-sm text-[#84967e]">/10</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] border-[#00b4d8]/30 text-[#00b4d8] bg-[#00b4d8]/5 font-mono">
                      {report.archetype}
                    </Badge>
                  </div>

                  {report.smoking_gun_url && (
                    <a
                      href={report.smoking_gun_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#84967e] hover:text-[#00ff41] font-mono transition-colors block truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {report.smoking_gun_url}
                    </a>
                  )}
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
                        {selectedReport.developer_handle}
                      </h3>
                      {selectedReport.smoking_gun_url && (
                        <p className="text-xs text-[#84967e] font-mono mt-1 truncate max-w-xs">
                          {selectedReport.smoking_gun_url}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-['Space_Grotesk'] font-black text-[#e1e2eb]">
                        {selectedReport.grit_score}
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
                        {formatDate(selectedReport.created_at)}
                      </p>
                    </div>
                  </div>

                  {selectedReport.smoking_gun_url && (
                    <div className="mt-6 pt-4 border-t border-[#3b4b37]/30">
                      <a
                        href={selectedReport.smoking_gun_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff41]/10 border border-[#00ff41]/20 text-[#00ff41] hover:bg-[#00ff41]/20 transition-colors font-['Space_Grotesk'] text-xs font-bold uppercase"
                        style={{ borderRadius: '0px' }}
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        View Original PR
                      </a>
                    </div>
                  )}
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
        )}
      </main>
    </div>
  );
}
