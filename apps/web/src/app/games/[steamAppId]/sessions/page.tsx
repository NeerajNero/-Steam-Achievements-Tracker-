'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { useGameSessions } from '@/features/sessions/api/use-game-sessions';
import { SessionList } from '@/features/sessions/components/session-list';
import {
  parseSessionListFilters,
  toSessionListSearchParams,
  type SessionListFilters,
} from '@/features/sessions/utils/session-filters';

export default function GameSessionsPage() {
  return (
    <PageShell>
      <Suspense
        fallback={<div className="p-6 text-sm text-slate-400">Loading sessions...</div>}
      >
        <GameSessionsPageContent />
      </Suspense>
    </PageShell>
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
      <div>
        <Link
          className="text-sm font-medium text-lime-200 hover:text-lime-100"
          href={`/games/${steamAppId}`}
        >
          Back to game
        </Link>
      </div>
      <PageHero
        actions={
          <Link
            className="rounded-xl bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
            href={`/games/${steamAppId}/sessions/new`}
          >
            New session
          </Link>
        }
        eyebrow={`Steam App ${steamAppId}`}
        title="Game Sessions"
      >
        <p>
          Find or create public sessions for app {steamAppId}, check participant
          counts, and move from browsing into scheduling without leaving the game hub.
        </p>
      </PageHero>

      <DataToolbar>
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
      </DataToolbar>

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
