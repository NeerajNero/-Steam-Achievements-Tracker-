import type { ReactNode } from 'react';

import { TopNav } from './top-nav';

export function AppShell({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopNav />
      {children}
      <footer className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 text-xs text-slate-500 md:px-6">
        Steam-only local platform. Public pages show stored platform data and never expose
        secrets, cookies, or session tokens.
      </footer>
    </div>
  );
}

