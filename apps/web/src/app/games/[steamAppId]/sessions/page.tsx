'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

import { AuthStatus } from '@/features/auth/components/auth-status';
import { useGameSessions } from '@/features/sessions/api/use-game-sessions';
import { SessionList } from '@/features/sessions/components/session-list';
import {
  parseSessionListFilters,
  toSessionListSearchParams,
  type SessionListFilters,
} from '@/features/sessions/utils/session-filters';

export default function GameSessionsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <Suspense
        fallback={<div className="p-6 text-sm text-slate-500">Loading sessions...</div>}
      >
        <GameSessionsPageContent />
      </Suspense>
    </main>
  );
}

function GameSessionsPageContent() {
  const params = useParams<{ steamAppId: string }>();
  const steamAppId = Number(params.steamAppId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseSessionListFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const sessions = useGameSessions(steamAppId, filters);

  function updateFilters(partial: Partial<SessionListFilters>): void {
    const next = { ...filters, ...partial };
    const params = toSessionListSearchParams(next);
    void router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            className="text-sm font-medium text-blue-700"
            href={`/games/${steamAppId}`}
          >
            Back to game
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            Game sessions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Find or create public sessions for app {steamAppId}.
          </p>
        </div>
        <AuthStatus />
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
        <Link
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          href={`/games/${steamAppId}/sessions/new`}
        >
          New session
        </Link>
      </section>

      <SessionList
        emptyMessage="No public sessions are scheduled for this Steam game yet."
        error={sessions.error}
        isError={sessions.isError}
        isLoading={sessions.isLoading}
        items={sessions.data?.items}
      />
    </div>
  );
}
