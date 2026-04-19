'use client';

// NOTE: Escrow settlement is in future roadmap (Phase 3). 
// Each company handles trial/contract terms differently, so payment flows 
// are handled directly between employer and candidate.

import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';

interface EscrowButtonProps {
  amount: number;
  bountyId: string;
  onSuccess?: (txHash: string) => void;
}

export function EscrowButton({ amount }: EscrowButtonProps) {
  const { address } = useAccount();

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="w-full bg-[#00ff41] hover:bg-[#72ff70] text-[#003907] font-['Space_Grotesk'] font-bold h-12 shadow-[0_0_15px_rgba(0,255,65,0.3)] transition-all active:opacity-50 border-none"
        disabled
        style={{ borderRadius: '0px' }}
      >
        {address ? 'HIRE CANDIDATE' : 'CONNECT WALLET TO HIRE'}
      </Button>
      <p className="text-[10px] text-[#84967e] text-center font-mono">
        On-chain settlement in roadmap (Phase 3)
      </p>
    </div>
  );
}
