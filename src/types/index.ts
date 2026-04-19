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

export interface PerplexityTaskRequest {
  bountyId: string;
  objective: string;
  constraints: string[];
  maxBudget: number;
  callbackUrl: string; // Our webhook
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
