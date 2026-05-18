import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/panel-state';

export function DashboardSignInPrompt({
  signInUrl,
}: Readonly<{
  signInUrl: string;
}>): ReactNode {
  return (
    <EmptyState
      action={
        <Link
          className="inline-flex rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
          href={signInUrl}
        >
          Sign in with Steam
        </Link>
      }
      message="Sign in with Steam to open your command center."
      title="Sign in required"
    />
  );
}
