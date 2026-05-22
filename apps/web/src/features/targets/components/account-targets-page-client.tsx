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
import { SummaryCard } from '@/components/ui/summary-card';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { buildSignInUrl } from '@/features/auth/components/auth-status';
import { useAccountTargets } from '@/features/targets/api/use-account-targets';
import { TargetList } from '@/features/targets/components/target-list';
import { getErrorMessage } from '@/lib/format';

export function AccountTargetsPageClient({
  statusParam,
}: Readonly<{
  statusParam: string | string[] | null;
}>): ReactNode {
  const selectedFilter = getSelectedFilter(statusParam);
  const currentUser = useCurrentUser();
  const targets = useAccountTargets(
    {
      limit: 100,
      status: selectedFilter.status,
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
        <PageHero
          actions={
            <>
              <Link
                className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
                href="/dashboard"
              >
                Back to dashboard
              </Link>
              <Link
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                href="/games"
              >
                Browse games
              </Link>
            </>
          }
          eyebrow="Completion planner"
          title="Achievement Targets"
        >
          <p>
            Keep a focused list of Steam games and achievements you are actively
            hunting. Active targets stay pinned in the dashboard until sync confirms
            they are completed, while completed targets remain here as proof of the
            plan paying off.
          </p>
        </PageHero>
        <section className="grid gap-3 md:grid-cols-3">
          <SummaryCard
            hint="Top-priority work that should still appear on the dashboard."
            label="Active tab"
            value="Live hunting queue"
          />
          <SummaryCard
            hint="Targets disappear from the dashboard but remain visible here."
            label="Completed tab"
            value="Confirmed by sync"
          />
          <SummaryCard
            hint="Unknown unlock state achievements can still be planned."
            label="Rules"
            value="No fake locked state"
          />
        </section>
        <div className="flex flex-wrap gap-2">
          {TARGET_FILTERS.map((filter) => (
            <Link
              className={filter.key === selectedFilter.key ? ACTIVE_FILTER_CLASS : FILTER_CLASS}
              href={filter.href}
              key={filter.key}
            >
              {filter.label}
            </Link>
          ))}
        </div>
        <TargetList
          actionHref="/games"
          actionLabel="Browse Games"
          emptyMessage={selectedFilter.emptyMessage}
          emptyTitle={selectedFilter.emptyTitle}
          error={targets.error}
          isError={targets.isError}
          isLoading={targets.isLoading}
          targets={targets.data?.items}
          title={selectedFilter.title}
        />
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
          <p>
            Achievement targets auto-complete after sync only when Steam confirms
            they were unlocked. Unknown unlock state remains targetable and does
            not auto-complete the target.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="inline-flex text-lime-200 hover:text-lime-100" href="/dashboard">
              Return to dashboard
            </Link>
            <Link className="inline-flex text-lime-200 hover:text-lime-100" href="/games">
              Find more games to target
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

const FILTER_CLASS =
  'inline-flex rounded-full border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10';
const ACTIVE_FILTER_CLASS =
  'inline-flex rounded-full border border-lime-300/30 bg-lime-400/10 px-3 py-2 text-sm font-semibold text-lime-100';

const TARGET_FILTERS = [
  {
    key: 'active',
    label: 'Active',
    href: '/account/targets',
    status: ListAccountTargetsStatusEnum.Active,
    title: 'Active Targets',
    emptyTitle: 'No active targets',
    emptyMessage: 'No active targets yet. Add targets from a game or achievement page.',
  },
  {
    key: 'completed',
    label: 'Completed',
    href: '/account/targets?status=completed',
    status: ListAccountTargetsStatusEnum.Completed,
    title: 'Completed Targets',
    emptyTitle: 'No completed targets',
    emptyMessage: 'Completed targets appear here after sync confirms the game or achievement is done.',
  },
  {
    key: 'all',
    label: 'All',
    href: '/account/targets?status=all',
    status: undefined,
    title: 'All Targets',
    emptyTitle: 'No targets',
    emptyMessage: 'No targets yet. Add targets from a game or achievement page.',
  },
] as const;

function getSelectedFilter(statusParam: string | string[] | null) {
  const normalizedStatus =
    typeof statusParam === 'string' ? statusParam : statusParam?.[0] ?? null;

  if (normalizedStatus === 'completed') {
    return TARGET_FILTERS[1];
  }

  if (normalizedStatus === 'all') {
    return TARGET_FILTERS[2];
  }

  return TARGET_FILTERS[0];
}
