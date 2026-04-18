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
