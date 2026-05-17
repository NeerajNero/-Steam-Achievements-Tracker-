'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

import { AuthStatus } from '@/features/auth/components/auth-status';
import { useGlobalSessions } from '@/features/sessions/api/use-global-sessions';
import { SessionList } from '@/features/sessions/components/session-list';
import {
  parseSessionListFilters,
  toSessionListSearchParams,
  type SessionListFilters,
} from '@/features/sessions/utils/session-filters';

export default function SessionsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <Suspense
        fallback={<div className="p-6 text-sm text-slate-500">Loading sessions...</div>}
      >
        <SessionsPageContent />
      </Suspense>
    </main>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link className="text-sm font-medium text-blue-700" href="/">
            Home
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            Steam sessions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse upcoming public co-op and achievement boosting sessions.
          </p>
        </div>
        <AuthStatus />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Status
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
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
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Page size
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
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
      </section>

      <SessionList
        error={sessions.error}
        isError={sessions.isError}
        isLoading={sessions.isLoading}
        items={sessions.data?.items}
      />
    </div>
  );
}
