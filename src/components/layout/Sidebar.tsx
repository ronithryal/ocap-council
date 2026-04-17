'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FilePlus, Settings, History, ShieldCheck } from 'lucide-react';

const navItems = [
  { name: 'Terminal', href: '/', icon: LayoutDashboard },
  { name: 'New Request', href: '/new', icon: FilePlus },
  { name: 'Trust Graph', href: '/trust', icon: ShieldCheck },
  { name: 'History', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            O
          </div>
          <span className="font-bold tracking-tighter text-xl">OCAP COUNCIL</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  pathname === item.href 
                    ? "bg-white/10 text-white" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  pathname === item.href ? "text-blue-400" : ""
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/5">
          <p className="text-[10px] text-blue-400 font-bold mb-1 uppercase tracking-widest">System Status</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/70">Council Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
