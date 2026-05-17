import type { GamingSessionDetailResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/panel-state';
import { useCancelSession } from '@/features/sessions/api/use-cancel-session';
import { useJoinSession } from '@/features/sessions/api/use-join-session';
import { useLeaveSession } from '@/features/sessions/api/use-leave-session';
import { formatDateTime } from '@/lib/format';

import { SessionParticipants } from './session-participants';
import { SessionStatusBadge } from './session-status-badge';

export function SessionDetail({
  canManage,
  isAuthenticated,
  session,
}: Readonly<{
  canManage: boolean;
  isAuthenticated: boolean;
  session: GamingSessionDetailResponseDto;
}>): ReactNode {
  const joinSession = useJoinSession(session.id);
  const leaveSession = useLeaveSession(session.id);
  const cancelSession = useCancelSession(session.id);

  return (
    <article className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {session.gameName} session
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
              {session.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {session.description ?? 'No description provided.'}
            </p>
          </div>
          <SessionStatusBadge status={session.status} />
        </div>

        <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-4">
          <div>
            <dt className="font-medium text-slate-500">Start</dt>
            <dd>{formatDateTime(session.scheduledStartAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">End</dt>
            <dd>{formatDateTime(session.scheduledEndAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Timezone</dt>
            <dd>{session.timezone ?? 'Not set'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Participants</dt>
            <dd>
              {session.participantCount}/{session.maxParticipants}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          {isAuthenticated ? (
            <>
              <button
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={joinSession.isPending || session.status !== 'open'}
                onClick={() => void joinSession.mutateAsync()}
                type="button"
              >
                {joinSession.isPending ? 'Joining...' : 'Join session'}
              </button>
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={leaveSession.isPending}
                onClick={() => void leaveSession.mutateAsync()}
                type="button"
              >
                {leaveSession.isPending ? 'Leaving...' : 'Leave session'}
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Sign in with Steam to join this session.
            </p>
          )}
          {canManage ? (
            <>
              <Link
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href={`/sessions/${session.id}/edit`}
              >
                Edit
              </Link>
              <button
                className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                disabled={cancelSession.isPending || session.status === 'cancelled'}
                onClick={() => void cancelSession.mutateAsync()}
                type="button"
              >
                {cancelSession.isPending ? 'Cancelling...' : 'Cancel'}
              </button>
            </>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-950">Participants</h2>
        </div>
        <SessionParticipants participants={session.participants} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-950">Target achievements</h2>
        </div>
        {session.achievements.length === 0 ? (
          <EmptyState message="No achievements are attached to this session yet." />
        ) : (
          <div className="divide-y divide-slate-200">
            {session.achievements.map((achievement) => (
              <div className="p-4" key={achievement.id}>
                <h3 className="font-medium text-slate-950">
                  {achievement.displayName ?? achievement.apiName}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Global rarity:{' '}
                  {achievement.globalPercentage === null ||
                  achievement.globalPercentage === undefined
                    ? 'Unknown'
                    : `${achievement.globalPercentage.toFixed(1)}%`}
                  {achievement.hidden ? ' · Hidden' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
