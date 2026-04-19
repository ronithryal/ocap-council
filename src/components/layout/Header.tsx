import { ConnectButton } from '@/components/wallet/ConnectButton';
import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="h-16 border-b border-[#1a1f26] bg-[#0b0e14]/20 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Badge 
          variant="outline" 
          className="text-[10px] border-[#00b4d8]/30 text-[#00b4d8] bg-[#00b4d8]/10 font-mono uppercase tracking-widest"
        >
          BASE SEPOLIA
        </Badge>
        <span className="text-xs text-[#84967e] font-mono hidden md:inline">
          NODE: US-EAST-1 // AUDIT: ACTIVE
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        <ConnectButton />
      </div>
    </header>
  );
}
