'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ShortlistCard } from './ShortlistCard';
import { ShortlistCandidate, HuntScore, ShortlistBucket, CandidateEvidence } from '@/types';

interface Props {
  bountyId: string | null;
}

interface VendorRow {
  id: string;
  bounty_id: string;
  name: string;
  github_url: string | null;
  validation_status: string;
  rejection_reason: string | null;
  is_primary: boolean | null;
  artifact_type: string | null;
  citation_id: number | null;
}

interface ReportRow {
  id: string;
  bounty_id: string;
  developer_handle: string;
  grit_score: number;
  archetype: string | null;
  recommendation: string | null;
  grit_markers: string[] | null;
  red_flags: string[] | null;
  justification: string | null;
}

function computeHuntScore(report: ReportRow | null): HuntScore {
  if (!report) {
    return { overall: 7.0, engineerQuality: 5.0, roleFit: 6.5, evidenceConfidence: 5.0 };
  }
  const engineerQuality = report.grit_score;
  const roleFit = 6.5;
  const markerCount = (report.grit_markers || []).length;
  const evidenceConfidence = parseFloat((Math.min(markerCount / 5, 1) * 10).toFixed(1));
  const overall = parseFloat((engineerQuality * 0.5 + roleFit * 0.3 + evidenceConfidence * 0.2).toFixed(1));
  return { overall, engineerQuality, roleFit, evidenceConfidence };
}

function assignBuckets(candidates: ShortlistCandidate[]): ShortlistCandidate[] {
  // candidates are pre-sorted by overall score descending
  // top = Archetype, next (up to index 2 or overall ≥ 6.5) = Solid Fit, rest = Alternative
  return candidates.map((c, i) => {
    if (i === 0) return { ...c, bucket: 'Archetype' as ShortlistBucket };
    if (i < 3 || c.huntScore.overall >= 6.5) return { ...c, bucket: 'Solid Fit' as ShortlistBucket };
    return { ...c, bucket: 'Alternative' as ShortlistBucket };
  });
}

const BUCKET_ORDER: ShortlistBucket[] = ['Archetype', 'Solid Fit', 'Alternative'];

const BUCKET_HEADER: Record<ShortlistBucket, { label: string; color: string; sub: string }> = {
  'Archetype':  { label: 'ARCHETYPE', color: '#00ff41', sub: 'Grit ≥ 8.0 · Distinct engineering signal' },
  'Solid Fit':  { label: 'SOLID FIT', color: '#feb700', sub: 'Overall ≥ 6.5 · Strong match for brief' },
  'Alternative':{ label: 'ALTERNATIVE', color: '#84967e', sub: 'Below threshold · Review manually' },
};

export function ShortlistPhase({ bountyId }: Props) {
  const [candidates, setCandidates] = useState<ShortlistCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadCandidates = async () => {
    if (!bountyId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: vendors, error: vErr } = await supabase
        .from('vendors')
        .select('id, bounty_id, name, github_url, validation_status, rejection_reason, is_primary, artifact_type, citation_id')
        .eq('bounty_id', bountyId)
        .order('created_at', { ascending: true });

      if (vErr) throw vErr;
      if (!vendors || vendors.length === 0) {
        setCandidates([]);
        return;
      }

      const { data: reports } = await supabase
        .from('engineer_reports')
        .select('id, bounty_id, developer_handle, grit_score, archetype, recommendation, grit_markers, red_flags, justification')
        .eq('bounty_id', bountyId);

      const reportsByHandle = new Map<string, ReportRow>();
      (reports || []).forEach((r) => reportsByHandle.set(r.developer_handle, r));

      const raw: ShortlistCandidate[] = (vendors as VendorRow[]).map((v) => {
        const report = reportsByHandle.get(v.name) ?? null;
        const huntScore = computeHuntScore(report);

        const evidence: CandidateEvidence[] = v.github_url
          ? [{
              id: v.id,
              artifactUrl: v.github_url,
              artifactType: (v.artifact_type === 'commit' ? 'commit' : 'pull_request') as 'pull_request' | 'commit',
              repo: v.github_url.replace('https://github.com/', '').split('/').slice(0, 2).join('/'),
              summary: '',
              validationStatus: (v.validation_status as 'validated' | 'rejected' | 'pending') ?? 'pending',
              signals: [],
              rejectionReason: v.rejection_reason ?? undefined,
              citationId: v.citation_id ?? null,
            }]
          : [];

        return {
          id: v.id,
          bountyId: v.bounty_id,
          developerHandle: v.name,
          archetype: report?.archetype as any ?? undefined,
          huntScore,
          bucket: 'Alternative' as ShortlistBucket,
          evidence,
          bestArtifactUrl: v.github_url ?? undefined,
          topSignal: report?.grit_markers?.[0] ?? undefined,
          topRisk: report?.red_flags?.[0] ?? undefined,
          recommendation: report?.recommendation as any ?? undefined,
          validationStatus: (v.validation_status as 'validated' | 'rejected' | 'pending') ?? 'pending',
          gritScore: report?.grit_score ?? undefined,
          reportId: report?.id ?? undefined,
        };
      });

      // Sort by overall score descending before bucket assignment
      raw.sort((a, b) => b.huntScore.overall - a.huntScore.overall);
      setCandidates(assignBuckets(raw));
    } catch (err: any) {
      setError(err.message || 'Failed to load shortlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [bountyId]);

  const handleAnalyze = async (candidateId: string) => {
    if (!bountyId || analyzingId) return;
    setAnalyzingId(candidateId);
    try {
      const res = await fetch(`/api/bounty/${bountyId}/diligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: candidateId }),
      });
      if (!res.ok) throw new Error('Diligence failed');
      await loadCandidates();
    } catch (err: any) {
      console.error('Analyze error:', err.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  if (!bountyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="material-symbols-outlined text-[#3b4b37] text-[32px] block mb-2">manage_search</span>
          <span className="font-mono text-[10px] text-[#3b4b37]">NO_ACTIVE_SESSION — dispatch an agent to build a shortlist</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <span className="material-symbols-outlined text-[#00ff41] animate-spin text-[24px]">progress_activity</span>
        <span className="font-mono text-[10px] text-[#84967e]">BUILDING_SHORTLIST...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-6 border border-[#ffb4ab]/20 bg-[#93000a]/5 text-center max-w-sm">
          <span className="material-symbols-outlined text-[#ffb4ab] text-[24px] block mb-2">error</span>
          <div className="font-mono text-[10px] text-[#ffb4ab]">{error}</div>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="material-symbols-outlined text-[#3b4b37] text-[32px] block mb-2">person_search</span>
          <span className="font-mono text-[10px] text-[#3b4b37]">SHORTLIST_EMPTY — no candidates found for this session</span>
        </div>
      </div>
    );
  }

  const byBucket = new Map<ShortlistBucket, ShortlistCandidate[]>();
  candidates.forEach((c) => {
    const arr = byBucket.get(c.bucket) ?? [];
    arr.push(c);
    byBucket.set(c.bucket, arr);
  });

  return (
    <div className="h-full overflow-y-auto p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-['Space_Grotesk'] font-black text-[#e1e2eb] text-lg uppercase tracking-tight">HUNT_RESULTS</h2>
          <div className="font-mono text-[9px] text-[#84967e] mt-0.5">{candidates.length} CANDIDATE{candidates.length !== 1 ? 'S' : ''} · {candidates.filter(c => c.validationStatus === 'validated').length} VALIDATED</div>
        </div>
        <button
          onClick={loadCandidates}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3b4b37]/60 text-[#84967e] font-['Space_Grotesk'] font-bold text-[9px] uppercase hover:border-[#00ff41]/40 hover:text-[#00ff41] transition-colors"
        >
          <span className="material-symbols-outlined text-[12px]">refresh</span>
          REFRESH
        </button>
      </div>

      {/* Bucket sections */}
      {BUCKET_ORDER.map((bucket) => {
        const group = byBucket.get(bucket);
        if (!group || group.length === 0) return null;
        const bh = BUCKET_HEADER[bucket];
        return (
          <div key={bucket} className="mb-6">
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-[#1a1f26]/60">
              <div className="h-2 w-2 flex-shrink-0" style={{ backgroundColor: bh.color }} />
              <span className="font-['Space_Grotesk'] font-bold text-[11px] uppercase tracking-widest" style={{ color: bh.color }}>
                {bh.label}
              </span>
              <span className="font-mono text-[9px] text-[#3b4b37]">{bh.sub}</span>
              <span className="ml-auto font-mono text-[9px] text-[#84967e]">{group.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {group.map((c) => (
                <ShortlistCard
                  key={c.id}
                  candidate={c}
                  isAnalyzing={analyzingId === c.id}
                  onAnalyze={handleAnalyze}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
