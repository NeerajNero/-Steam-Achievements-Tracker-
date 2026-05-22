'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { useGlobalSessions } from '@/features/sessions/api/use-global-sessions';
import { SessionList } from '@/features/sessions/components/session-list';
import {
  parseSessionListFilters,
  toSessionListSearchParams,
  type SessionListFilters,
} from '@/features/sessions/utils/session-filters';

export default function SessionsPage() {
  return (
    <PageShell>
      <Suspense
        fallback={<div className="p-6 text-sm text-slate-400">Loading sessions...</div>}
      >
        <SessionsPageContent />
      </Suspense>
    </PageShell>
  );
}

function SessionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseSessionListFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const sessions = useGlobalSessions(filters);

  function updateFilters(partial: Partial<SessionListFilters>): void {
    const next = { ...filters, ...partial };
    const params = toSessionListSearchParams(next);
    void router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <div className="grid gap-6">
      <PageHero eyebrow="Community scheduling" title="Steam sessions">
        <p>
          Browse upcoming public co-op and achievement boosting sessions, check
          roster pressure, and see which game communities already have scheduled runs.
        </p>
      </PageHero>

      <DataToolbar
        description="Filter the session board by roster state and page size."
        title="Session Filters"
      >
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-sm font-medium text-slate-300">
            Status
            <select
              className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              onChange={(event) =>
                updateFilters({
                  status: event.target.value as SessionListFilters['status'],
                  offset: 0,
                })
              }
              value={filters.status}
            >
              <option value="open">Open</option>
              <option value="full">Full</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-300">
            Page size
            <select
              className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              onChange={(event) =>
                updateFilters({ limit: Number(event.target.value), offset: 0 })
              }
              value={filters.limit}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </DataToolbar>

      <SessionList
        error={sessions.error}
        isError={sessions.isError}
        isLoading={sessions.isLoading}
        items={sessions.data?.items}
      />
    </div>
  );
}
