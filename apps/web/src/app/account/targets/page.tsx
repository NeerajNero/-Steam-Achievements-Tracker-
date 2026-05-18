'use client';

import {
  ListAccountTargetsStatusEnum,
  ListAccountTargetsTypeEnum,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { buildSignInUrl } from '@/features/auth/components/auth-status';
import { useAccountTargets } from '@/features/targets/api/use-account-targets';
import { TargetList } from '@/features/targets/components/target-list';
import { getErrorMessage } from '@/lib/format';

export default function AccountTargetsPage(): ReactNode {
  const currentUser = useCurrentUser();
  const targets = useAccountTargets(
    {
      limit: 100,
      status: ListAccountTargetsStatusEnum.Active,
      type: ListAccountTargetsTypeEnum.All,
    },
    currentUser.data !== undefined && currentUser.data !== null,
  );

  if (currentUser.isLoading) {
    return (
      <PageShell>
        <PageHero eyebrow="Completion planner" title="Achievement Targets">
          <p>Loading your signed-in target list.</p>
        </PageHero>
        <LoadingState message="Checking sign-in status..." />
      </PageShell>
    );
  }

  if (currentUser.isError) {
    return (
      <PageShell>
        <ErrorState
          message={getErrorMessage(currentUser.error)}
          title="Unable to check sign-in status"
        />
      </PageShell>
    );
  }

  if (!currentUser.data) {
    return (
      <PageShell maxWidth="max-w-4xl">
        <PageHero eyebrow="Completion planner" title="Achievement Targets">
          <p>Sign in to save Steam games and achievements as active completion targets.</p>
        </PageHero>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <h2 className="font-semibold text-white">Sign in required</h2>
          <p className="mt-1 text-sm text-slate-400">
            Targets are private account data and appear in your Hunter Command Center.
          </p>
          <a
            className="mt-4 inline-flex rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
            href={buildSignInUrl('/account/targets')}
          >
            Sign in with Steam
          </a>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHero eyebrow="Completion planner" title="Achievement Targets">
          <p>
            Keep a focused list of Steam games and achievements you are actively
            hunting.
          </p>
        </PageHero>
        <TargetList
          actionHref="/games"
          actionLabel="Browse Games"
          emptyMessage="No targets yet. Add targets from a game or achievement page."
          error={targets.error}
          isError={targets.isError}
          isLoading={targets.isLoading}
          targets={targets.data?.items}
          title="Active Targets"
        />
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
          <p>
            Achievement targets can be saved even when Steam exposes metadata but
            not player unlock state.
          </p>
          <Link className="mt-3 inline-flex text-lime-200 hover:text-lime-100" href="/dashboard">
            Return to dashboard
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
