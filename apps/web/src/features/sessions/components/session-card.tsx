import type { GamingSessionSummaryResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { formatDateTime } from '@/lib/format';

import { SessionStatusBadge } from './session-status-badge';

export function SessionCard({
  session,
}: Readonly<{
  session: GamingSessionSummaryResponseDto;
}>): ReactNode {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            className="text-lg font-semibold text-slate-950 hover:text-blue-700"
            href={`/sessions/${session.id}`}
          >
            {session.title}
          </Link>
          <p className="mt-1 text-sm text-slate-600">
            {session.description ?? 'No description provided.'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {session.gameName} · {formatDateTime(session.scheduledStartAt)}
            {session.timezone ? ` · ${session.timezone}` : ''}
          </p>
        </div>
        <SessionStatusBadge status={session.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
        <div>
          <dt className="font-medium text-slate-500">Participants</dt>
          <dd>
            {session.participantCount}/{session.maxParticipants}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Achievements</dt>
          <dd>{session.achievementCount}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Host</dt>
          <dd>{session.host.displayName ?? 'Steam user'}</dd>
        </div>
      </dl>
    </article>
  );
}
