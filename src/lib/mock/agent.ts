import { AgentPhase, Vendor, PerplexityWebhookResponse } from '@/types';

/**
 * Mock Agent Engine for Day 1 Demo.
 * Simulates a multi-phase procurement loop.
 */

export const MOCK_VENDOR: Vendor = {
  id: 'v1',
  bountyId: '',
  name: 'Visionary Films SF',
  credentials: '10+ years SF locale, Red V-Raptor, 500+ commercial shoots.',
  quoteAmount: 450,
  linkedinUrl: 'https://linkedin.com/in/visionary-films',
  githubUrl: 'https://github.com/visionary-films',
  websiteUrl: 'https://visionaryfilms.com',
  summary: 'Specializes in high-end corporate videography in San Francisco. Identified as the primary match due to locale proximity and equipment compliance.',
  isVerified: true,
};

export async function simulateAgentWorkflow(
  bountyId: string,
  onPhaseChange: (phase: AgentPhase, message: string) => void,
  onComplete: (response: PerplexityWebhookResponse) => void
) {
  const steps: { phase: AgentPhase; message: string; delay: number }[] = [
    { phase: 'dispatching', message: 'OCAP Council initializing... Hydrating requirements with industry standards.', delay: 2000 },
    { phase: 'navigating', message: 'Navigating professional networks and discovery portals (Sonar-Pro)...', delay: 3000 },
    { phase: 'vetting', message: 'Vetting credentials against 5-year experience requirement. Comparing portfolios.', delay: 4000 },
    { phase: 'awaiting_quote', message: 'Requesting binding quotes via 2026 decentralized vendor oracle...', delay: 3000 },
    { phase: 'quote_received', message: 'Vetted candidate identified. Generating summary and contact details.', delay: 2000 },
  ];

  for (const step of steps) {
    onPhaseChange(step.phase, step.message);
    await new Promise(resolve => setTimeout(resolve, step.delay));
    
    // Trigger real backend update in parallels if needed, 
    // but for demo we just manage local state
  }

  onComplete({
    bountyId,
    status: 'success',
    findings: {
      selectedVendor: { ...MOCK_VENDOR, bountyId },
      alternativeVendors: [],
      rawAgentOutput: 'High confidence match found in SF district.',
    }
  });
}
