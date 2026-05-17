'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { AuthStatus } from '@/features/auth/components/auth-status';

import { isNavLinkActive } from './nav-utils';

const primaryLinks = [
  { href: '/', label: 'Home' },
  { href: '/games', label: 'Games' },
  { href: '/leaderboards', label: 'Leaderboards' },
  { href: '/games/910001/guides', label: 'Guides' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/activity', label: 'Activity' },
] as const;

export function TopNav(): ReactNode {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link className="group flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400 font-black text-slate-950 shadow-[0_0_24px_rgba(163,230,53,0.35)]">
              SA
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">
                Steam Achievement
              </span>
              <span className="block text-xs text-slate-400">Hunter dashboard</span>
            </span>
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-1">
            {primaryLinks.map((link) => (
              <Link
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  isNavLinkActive(pathname, link.href)
                    ? 'bg-lime-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <AuthStatus compact />
      </div>
    </header>
  );
}
