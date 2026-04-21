/**
 * OCAP (On-Chain Agentic Procurement) Type Definitions
 * Following a "Types-First" engineering discipline.
 */

export type AgentPhase = 
  | 'idle' 
  | 'hydrating'
  | 'dispatching' 
  | 'navigating' 
  | 'vetting' 
  | 'awaiting_quote' 
  | 'quote_received' 
  | 'settling' 
  | 'completed' 
  | 'failed';

export interface BountyRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  agentPhase: AgentPhase;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  bountyId: string;
  name: string;
  credentials: string;
  quoteAmount: number;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  summary: string;
  isVerified: boolean;
}

export interface AgentStatus {
  bountyId: string;
  phase: AgentPhase;
  message: string;
  progress: number; // 0 to 100
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface EscrowTransaction {
  id: string;
  bountyId: string;
  vendorId: string;
  amount: number;
  txHash: string;
  chain: string; // e.g., 'base-sepolia'
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

/**
 * V2 Forensic Engineering Types
 */

export interface ForensicCodeLibrary {
  id: string;
  githubUrl: string;
  archetypeLabel: string;
  rawDiffLogic: string;
  // vectorEmbedding is omitted from FE types as it's typically handled server-side via pgvector
  createdAt: string;
}

export interface EngineerReport {
  id: string;
  bountyId: string;
  developerHandle: string;
  smokingGunUrl?: string;
  gritScore: number;
  archetype: ForensicScore['archetype'];
  dimensions: ForensicScore['dimensions'];
  gritMarkers: string[];
  redFlags: string[];
  justification: string;
  recommendation: ForensicScore['recommendation'];
  createdAt: string;
}

/**
 * Structured output from the Forensic Scorer (Claude 3.5 Sonnet).
 * Evaluates a developer's PR diff against the OCAP "Grit vs Slop" rubric.
 */
export interface ForensicScore {
  // 0-10, overall engineering grit signal
  gritScore: number;

  // Archetype classification based on what the diff actually demonstrates
  archetype: 'Concurrency Master' | 'State Architect' | 'Chaos Engineer' | 'Generalist' | 'Uncategorized';

  // Dimensional breakdown (each 0-10)
  dimensions: {
    // Did they think about race conditions, null cases, timeouts, malformed input?
    edgeCaseDensity: number;
    // Do they manage state transitions explicitly, or let chaos leak?
    architecturalIntent: number;
    // Is this idiosyncratic human logic, or AI-slop boilerplate?
    codeFingerprint: number;
    // Did they write real tests that prove correctness (not just coverage)?
    testingRigor: number;
  };

  // Things that PROVE grit (specific lines/patterns to reference)
  gritMarkers: string[];

  // Things that look LIKE AI-slop or carelessness
  redFlags: string[];

  // One-paragraph CTO-grade justification
  justification: string;

  // Final call: hire, review, or reject?
  recommendation: 'HIRE' | 'NEEDS_HUMAN_REVIEW' | 'DO_NOT_HIRE';
}

/**
 * Perplexity API Integration Types
 * Based on the Sonar Reasoning / Computer Agent model
 */

export interface CapabilityBucket {
  name: string;
  description: string;
  searchQueries: string[];
  artifactHints: string[];
  weight: number;
}

export interface GitHubSignalSet {
  techStack: string[];
  keywords: string[];
  toolsEcosystem: string[];
  logicPatterns: string[];
  repoShapes: string[];
}

export interface ProofOfWorkRequirement {
  evidencePattern: string;
  whyItMatters: string;
  weakSignalLooksLike: string;
}

export interface DisqualifierRule {
  rule: string;
  reason: string;
  severity: 'hard_reject' | 'caution';
}

export interface ArchitectPlan {
  hydratedRoleBrief: string;
  sourcingPersona?: string;
  capabilityBuckets: CapabilityBucket[];
  githubSignals: GitHubSignalSet;
  proofOfWorkRequirements?: ProofOfWorkRequirement[];
  disqualifiers?: DisqualifierRule[];
  goldMedalSignal?: string;
  targetRepos?: string[];
}

export interface PerplexityTaskRequest {
  bountyId: string;
  objective: string;
  constraints?: string[];
  maxBudget?: number;
  callbackUrl?: string; // Our webhook
  architectPlan?: ArchitectPlan;
}

export interface PerplexityWebhookResponse {
  bountyId: string;
  status: 'success' | 'failure';
  findings: {
    selectedVendor: Partial<Vendor>;
    alternativeVendors: Partial<Vendor>[];
    rawAgentOutput: string;
  };
  error?: string;
}

// ─── Search / Shortlist / Diligence Types ────────────────────────────────────

/** The 4 phases of the unified Search workflow. */
export type SearchPhase = 'brief' | 'capability-map' | 'hunt' | 'shortlist';

/** Shortlist grouping bucket. */
export type ShortlistBucket = 'Archetype' | 'Solid Fit' | 'Alternative';

/** Candidate-level diligence recommendation labels. */
export type DiligenceRecommendation = 'HIRE' | 'STRONG_FIT' | 'REVIEW' | 'PASS';

/** A single piece of evidence (PR/commit artifact) attached to a candidate. */
export interface CandidateEvidence {
  id: string;
  artifactUrl: string;
  artifactType: 'pull_request' | 'commit';
  repo: string;
  summary: string;
  validationStatus: 'validated' | 'rejected' | 'pending';
  /** 0-10 from forensic scorer, populated after analysis. */
  artifactQuality?: number;
  signals: string[];
  rejectionReason?: string;
  citationId?: number | null;
}

/**
 * Weighted composite score for a candidate.
 * roleFit is 6.5 neutral until role-fit scoring is implemented.
 */
export interface HuntScore {
  overall: number;           // weighted composite, 0-10
  engineerQuality: number;   // technical ceiling — from grit_score when available
  roleFit: number;           // fit for this specific brief
  evidenceConfidence: number; // strength/consistency of evidence
}

/** A candidate entry in the shortlist, aggregating vendor + report data. */
export interface ShortlistCandidate {
  id: string;                // vendor row id
  bountyId: string;
  developerHandle: string;
  archetype?: ForensicScore['archetype'];
  huntScore: HuntScore;
  bucket: ShortlistBucket;
  evidence: CandidateEvidence[];
  bestArtifactUrl?: string;
  bestArtifactSummary?: string;
  topSignal?: string;
  topRisk?: string;
  recommendation?: ForensicScore['recommendation'];
  validationStatus: 'validated' | 'rejected' | 'pending';
  gritScore?: number;
  reportId?: string;
}
