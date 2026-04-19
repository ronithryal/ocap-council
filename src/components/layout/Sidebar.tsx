'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'ARCHITECT', href: '/', icon: 'smart_toy', label: 'Architect' },
  { name: 'HUNTING', href: '/hunting', icon: 'radar', label: 'Hunting' },
  { name: 'AUDIT', href: '/audit', icon: 'biotech', label: 'Audit' },
  { name: 'DILIGENCE', href: '/diligence', icon: 'description', label: 'Diligence' },
];

const footerItems = [
  { name: 'TERMINAL', href: '/terminal', icon: 'terminal' },
  { name: 'LOGS', href: '/logs', icon: 'list_alt' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[240px] h-screen flex flex-col fixed left-0 top-0 z-40 bg-[#0b0e14] border-r border-[#1a1f26]/60">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1a1f26]/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-[#feb700] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#0b0e14] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              smart_toy
            </span>
          </div>
          <div>
            <h1 className="font-['Space_Grotesk'] font-black text-[#00ff41] tracking-tighter text-base leading-none">FORENSIC_OS</h1>
            <p className="font-mono text-[9px] text-[#84967e] mt-0.5">V2.4.0_STABLE</p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 transition-all duration-100 relative group',
                isActive
                  ? 'text-[#00ff41] bg-[#00ff41]/8 border-l-2 border-[#00ff41]'
                  : 'text-[#84967e] hover:text-[#e1e2eb] hover:bg-[#1a1f26]/60 border-l-2 border-transparent'
              )}
            >
              {/* Surgical hover trace */}
              {!isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-px bg-[#00ff41] opacity-0 group-hover:opacity-60 transition-opacity" />
              )}
              <span
                className={cn(
                  'material-symbols-outlined text-[18px] flex-shrink-0',
                  isActive ? 'drop-shadow-[0_0_6px_rgba(0,255,65,0.6)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.3)]'
                )}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className={cn(
                "font-['Space_Grotesk'] text-[11px] uppercase tracking-widest",
                isActive ? 'font-bold' : 'font-medium'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* INIT_SCAN CTA */}
      <div className="px-3 pb-4">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#00ff41] hover:bg-[#72ff70] text-[#003907] font-['Space_Grotesk'] font-black text-[11px] uppercase tracking-widest transition-all active:opacity-70"
          style={{ borderRadius: '0px' }}
        >
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          INIT_SCAN
        </Link>
      </div>

      {/* Footer Nav */}
      <div className="border-t border-[#1a1f26]/60 py-2 flex flex-col gap-0.5 px-3">
        {footerItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-[#84967e] hover:text-[#b9ccb2] hover:bg-[#1a1f26]/40 transition-colors group"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>
              {item.icon}
            </span>
            <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
