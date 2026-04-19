'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Architect', href: '/', icon: 'smart_toy' },
  { name: 'Hunting', href: '/hunting', icon: 'radar' },
  { name: 'Audit', href: '/audit', icon: 'biotech' },
  { name: 'Diligence', href: '/diligence', icon: 'description' },
];

const footerItems = [
  { name: 'Terminal', href: '/terminal', icon: 'terminal' },
  { name: 'Logs', href: '/logs', icon: 'list_alt' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen flex flex-col fixed left-0 top-0 z-40 bg-[#0b0e14] border-r border-[#1a1f26]">
      {/* Header - FORENSIC_OS Logo */}
      <div className="p-6 border-b border-[#1a1f26] bg-[#10131a]">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-[#272a31] flex items-center justify-center ghost-border">
            <span className="material-symbols-outlined text-[#00ff41]" style={{ fontVariationSettings: "'FILL' 1" }}>
              terminal
            </span>
          </div>
          <div>
            <h1 className="font-['Space_Grotesk'] font-black text-[#00ff41] tracking-tighter text-xl">FORENSIC_OS</h1>
            <p className="font-mono text-[10px] text-[#b9ccb2]">V2.4.0_STABLE</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 transition-colors duration-100 relative group",
                isActive 
                  ? "text-[#00ff41] bg-[#00ff41]/5 border-l-2 border-[#00ff41]" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-[#1a1f26] hover:text-[#00ff41] border-l-2 border-transparent"
              )}
            >
              {/* Technical Trace on hover */}
              <span className={cn(
                "absolute left-0 top-0 bottom-0 w-px bg-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity",
                isActive ? "opacity-100" : ""
              )} />
              <span className="material-symbols-outlined text-[18px] group-hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className={cn(
                "font-['Space_Grotesk'] tracking-tight text-xs uppercase hidden md:block",
                isActive ? "font-bold" : ""
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* CTA Action */}
      <div className="p-4 hidden md:block">
        <button className="w-full bg-[#00ff41] text-[#003907] font-['Space_Grotesk'] font-bold text-xs py-3 uppercase tracking-wider hover:bg-[#72ff70] transition-colors active:opacity-50 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
          INIT_SCAN
        </button>
      </div>

      {/* Footer Navigation */}
      <div className="mt-auto border-t border-[#1a1f26] bg-[#10131a] py-4 flex flex-col gap-1 px-2">
        {footerItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 px-4 py-2 text-slate-500 hover:text-[#00ff41] hover:bg-[#1a1f26] transition-colors group"
          >
            <span className="material-symbols-outlined text-[16px]">
              {item.icon}
            </span>
            <span className="font-mono text-[10px] uppercase hidden md:block">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
