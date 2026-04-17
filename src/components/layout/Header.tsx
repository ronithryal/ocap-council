import { ConnectButton } from '@/components/wallet/ConnectButton';
import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/10 py-0.5">
          BASE SEPOLIA
        </Badge>
        <span className="text-xs text-white/40 font-mono hidden md:inline">
          NODE: US-EAST-1 // AUDIT: ACTIVE
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        <ConnectButton />
      </div>
    </header>
  );
}
