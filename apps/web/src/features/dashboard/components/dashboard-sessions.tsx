import type { DashboardSessionResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime, formatNumber } from '@/lib/format';

export function DashboardSessions({
  hosted,
  joined,
  upcomingForOwnedGames,
}: Readonly<{
  hosted: readonly DashboardSessionResponseDto[];
  joined: readonly DashboardSessionResponseDto[];
  upcomingForOwnedGames: readonly DashboardSessionResponseDto[];
}>): ReactNode {
  const hasSessions =
    hosted.length > 0 ||
    joined.length > 0 ||
    upcomingForOwnedGames.length > 0;

  return (
    <SectionCard
      actions={
        <Link
          className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          href="/sessions"
        >
          Browse sessions
        </Link>
      }
      description="Hosted, joined, and upcoming public sessions for games in your Steam library."
      title="Sessions"
    >
      {!hasSessions ? (
        <EmptyState
          message="No joined sessions yet. Browse upcoming sessions."
          title="No sessions queued"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <SessionColumn items={hosted} title="Hosting" />
          <SessionColumn items={joined} title="Joined" />
          <SessionColumn items={upcomingForOwnedGames} title="Owned games" />
        </div>
      )}
    </SectionCard>
  );
}

function SessionColumn({
  items,
  title,
}: Readonly<{
  items: readonly DashboardSessionResponseDto[];
  title: string;
}>): ReactNode {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          Nothing scheduled here.
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          {items.map((session) => (
            <Link
              className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/40 hover:bg-cyan-300/5"
              href={`/sessions/${session.id}`}
              key={session.id}
            >
              <div className="flex items-start gap-3">
                {session.gameIconUrl ? (
                  <img
                    alt=""
                    className="h-10 w-10 rounded-lg border border-white/10"
                    src={session.gameIconUrl}
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{session.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{session.gameName}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <StatusBadge tone="info">{session.status}</StatusBadge>
                <span>{formatDateTime(session.scheduledStartAt)}</span>
                <span>
                  {formatNumber(session.participantCount)} /{' '}
                  {formatNumber(session.maxParticipants)} hunters
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
