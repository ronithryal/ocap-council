'use client';

import { useState } from 'react';
import { useAccount, useWriteContracts } from 'wagmi';
import { parseUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from '@coinbase/onchainkit/transaction';
import { baseSepolia } from 'wagmi/chains';

const USDC_ADDRESS = '0x036CbD53842c5426434e7c200b2CceBb0e8Eb8B6';
const MOCK_ESCROW_CONTRACT = '0x1234567890123456789012345678901234567890'; // Replace with real escrow if available

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'boolean' }],
  },
] as const;

interface EscrowButtonProps {
  amount: number;
  bountyId: string;
  onSuccess?: (txHash: string) => void;
}

export function EscrowButton({ amount, bountyId, onSuccess }: EscrowButtonProps) {
  const { address } = useAccount();

  // OnchainKit Transaction components handle the lifecycle and paymaster sponsorship
  const contracts = [
    {
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [MOCK_ESCROW_CONTRACT, parseUnits(amount.toString(), 6)], // USDC has 6 decimals
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <Transaction
        chainId={baseSepolia.id}
        contracts={contracts}
        onSuccess={(response) => {
          console.log('Transaction successful', response);
          if (onSuccess && response.transactionReceipts[0]) {
            onSuccess(response.transactionReceipts[0].transactionHash);
          }
        }}
      >
        <TransactionButton 
          text="Hire & Lock Funds (Gasless)" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl transition-all glow-border"
        />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>
      
      <p className="text-[10px] text-muted-foreground text-center">
        Gas sponsored by OCAP Council via CDP Paymaster
      </p>
    </div>
  );
}
