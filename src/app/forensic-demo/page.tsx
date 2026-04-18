/**
 * OCAP V2 — Forensic Dashboard Demo
 * 
 * This page demonstrates the "Cynical Dashboard" using real calibration data
 * from the end-to-end smoke tests (golang/go#78798 and rust-lang/rust#135179).
 * 
 * In the full V2 product, this data comes from:
 *   1. Perplexity Hunter → finds developer + smoking_gun_url
 *   2. GitHub API → fetches raw .diff
 *   3. Forensic Scorer (Claude) → generates ForensicScore
 *   4. This Dashboard → renders the CTO-grade report
 */

import { ForensicDashboard } from '@/components/forensic/ForensicDashboard';
import type { ForensicScore } from '@/types';

// Real calibration data from CLI smoke tests
const DEMO_REPORTS: Array<{
  id: string;
  developerHandle: string;
  smokingGunUrl: string;
  report: ForensicScore;
}> = [
  {
    id: 'demo-1',
    developerHandle: 'golang/go contributor',
    smokingGunUrl: 'https://github.com/golang/go/pull/78798',
    report: {
      gritScore: 1,
      archetype: 'Uncategorized',
      dimensions: {
        edgeCaseDensity: 0,
        architecturalIntent: 0,
        codeFingerprint: 2,
        testingRigor: 0,
      },
      gritMarkers: [
        'Changed panic message from \'bad load type\' to \'bad move type\' in moveByType function to match the function\'s purpose',
      ],
      redFlags: [
        'Single-character documentation fix with no actual logic change',
        'No tests added or modified despite touching error messaging',
        'Trivial contribution that shows no engineering depth',
        'Function name is moveByType but old panic said \'load\' — this should have been caught in code review',
      ],
      justification:
        'This is a one-word documentation fix in a panic message. While technically correct (the function is named moveByType, not loadByType), this demonstrates zero engineering grit. There is no edge case handling, no architectural thinking, no testing rigor, and minimal human fingerprint beyond noticing a minor inconsistency. This could be automated by a linter. The diff provides no evidence the candidate can write production code, handle failure modes, design systems, or test rigorously. I would not spend $2,000 on a trial based on fixing a typo in an error message that likely never gets hit in production. This is noise, not signal.',
      recommendation: 'DO_NOT_HIRE',
    },
  },
  {
    id: 'demo-2',
    developerHandle: 'rust-lang/rust contributor',
    smokingGunUrl: 'https://github.com/rust-lang/rust/pull/135179',
    report: {
      gritScore: 7,
      archetype: 'State Architect',
      dimensions: {
        edgeCaseDensity: 6,
        architecturalIntent: 8,
        codeFingerprint: 8,
        testingRigor: 6,
      },
      gritMarkers: [
        'compiler/rustc_hir_typeck/src/method/confirm.rs: Converts chained method call to explicit binding, enabling conditional behavior (autoderef = autoderef.use_receiver_trait()) based on feature flags',
        'compiler/rustc_hir_typeck/src/method/confirm.rs: Feature-gated behavior change for arbitrary_self_types with use_receiver_trait(), showing awareness of language feature stability boundaries',
        'tests/ui/self/arbitrary_self_types_dispatch_to_vtable.rs: Test exercises trait object dispatch with custom receiver type (MyDispatcher<dyn Trait>), validating the specific vtable dispatch path enabled by the change',
        'Comment \'We don\'t need to gate this behind arbitrary self types per se, but it does make things a bit more gated\' shows careful consideration of feature stability boundaries and deliberate design choice',
      ],
      redFlags: [
        'Test only validates happy path (check-pass directive) with no negative test cases for when features are disabled or edge cases around vtable dispatch failures',
        'Single test case doesn\'t explore edge cases like multiple dereference levels, null safety beyond construction, or interaction with other receiver types',
      ],
      justification:
        'This is compiler work on Rust\'s method dispatch system, specifically enabling arbitrary self types to properly dispatch through vtables. The architectural intent is strong — breaking a method chain to conditionally inject use_receiver_trait() based on feature flags shows understanding of the autoderef machinery and how receiver traits interact with dynamic dispatch. The code fingerprint is distinctly human: the comment "this feels, like, super dubious" removal paired with the new comment about gating shows someone who\'s thought through the design constraints, not AI slop. The test demonstrates understanding of the vtable dispatch path with a custom receiver type that doesn\'t deref to its target, which is conceptually sophisticated. However, testing rigor is merely adequate — one check-pass test isn\'t enough to validate all edge cases or prove robustness under feature flag permutations. Edge case density is moderate; the feature-gating is good defensive programming but doesn\'t explore failure modes. This is solid compiler engineering with clear architectural thinking, worth a trial to see if they can maintain this rigor across a broader scope of work.',
      recommendation: 'NEEDS_HUMAN_REVIEW',
    },
  },
];

export default function ForensicDemoPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-green-400/60 uppercase tracking-widest">
            OCAP V2 — Forensic Engine
          </span>
        </div>
        <h1 className="text-4xl font-bold font-mono tracking-tight mb-2">
          Cynical Dashboard
        </h1>
        <p className="text-white/40 font-mono text-sm">
          CTO-grade forensic reports generated from raw GitHub diffs. No stars. No followers. Just code.
        </p>
      </div>

      {/* Demo Reports */}
      <div className="space-y-16">
        {DEMO_REPORTS.map((demo) => (
          <section key={demo.id}>
            <div className="max-w-4xl mx-auto mb-4">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                Calibration Run {demo.id.replace('demo-', '#')}
              </span>
            </div>
            <ForensicDashboard
              report={demo.report}
              developerHandle={demo.developerHandle}
              smokingGunUrl={demo.smokingGunUrl}
              onHireForTrial={() => console.log('hire:', demo.id)}
              onDoNotHire={() => console.log('reject:', demo.id)}
            />
          </section>
        ))}
      </div>

      {/* API Endpoint Reference */}
      <div className="max-w-4xl mx-auto mt-24 pt-8 border-t border-white/5">
        <h3 className="text-xs font-mono text-white/20 uppercase tracking-widest mb-4">
          V2 Forensic Pipeline — Endpoints
        </h3>
        <div className="space-y-2 font-mono text-sm text-white/40">
          <div>
            <span className="text-blue-400">POST</span> /api/bounty
            <span className="text-white/20 ml-2">→ creates bounty</span>
          </div>
          <div>
            <span className="text-blue-400">POST</span> /api/bounty/[id]/dispatch
            <span className="text-white/20 ml-2">→ Perplexity Hunter finds developer + smoking_gun_url</span>
          </div>
          <div>
            <span className="text-blue-400">POST</span> /api/bounty/[id]/diligence
            <span className="text-white/20 ml-2">→ GitHub API + Claude forensic scorer → ForensicScore</span>
          </div>
          <div>
            <span className="text-blue-400">GET</span> /api/bounty/[id]/status
            <span className="text-white/20 ml-2">→ polling endpoint for agent phase tracking</span>
          </div>
        </div>
      </div>
    </main>
  );
}