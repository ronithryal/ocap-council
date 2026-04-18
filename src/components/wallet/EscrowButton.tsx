'use client';

// NOTE: EscrowButton V2 settlement UI is parked pending V2 Dashboard rebuild.
// The Transaction component API in @coinbase/onchainkit v1.x has breaking changes
// (wagmi v2 integration, `calls` shape, ConnectWallet props). Re-enable once
// the V2 Cynical Dashboard is built. The current state is intentionally
// minimal to unblock `npm run dev` for the forensic pipeline demo.

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
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl transition-all"
        disabled
      >
        {address ? 'Hire & Lock Funds (Gasless)' : 'Connect Wallet to Hire'}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">
        Settlement UI — parked until V2 Dashboard rebuild
      </p>
    </div>
  );
}
