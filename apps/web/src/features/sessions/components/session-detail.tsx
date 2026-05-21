import type { GamingSessionDetailResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
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
      <SectionCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-lime-300">
              {session.gameName} session
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">
              {session.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              {session.description ?? 'No description provided.'}
            </p>
          </div>
          <SessionStatusBadge status={session.status} />
        </div>

        <dl className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-4">
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
                className="rounded-xl bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-60"
                disabled={joinSession.isPending || session.status !== 'open'}
                onClick={() => void joinSession.mutateAsync()}
                type="button"
              >
                {joinSession.isPending ? 'Joining...' : 'Join session'}
              </button>
              <button
                className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
                disabled={leaveSession.isPending}
                onClick={() => void leaveSession.mutateAsync()}
                type="button"
              >
                {leaveSession.isPending ? 'Leaving...' : 'Leave session'}
              </button>
            </>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">
              Sign in with Steam to join this session.
            </p>
          )}
          {canManage ? (
            <>
              <Link
                className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                href={`/sessions/${session.id}/edit`}
              >
                Edit
              </Link>
              <button
                className="rounded-xl border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60"
                disabled={cancelSession.isPending || session.status === 'cancelled'}
                onClick={() => void cancelSession.mutateAsync()}
                type="button"
              >
                {cancelSession.isPending ? 'Cancelling...' : 'Cancel'}
              </button>
            </>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        description="See who is hosting, who has joined, and whether the roster is already full."
        title="Participants"
      >
        <SessionParticipants participants={session.participants} />
      </SectionCard>

      <SectionCard
        description="These are the planned achievement unlocks or cleanup targets for the session."
        title="Target Achievements"
      >
        {session.achievements.length === 0 ? (
          <EmptyState message="No achievements are attached to this session yet." />
        ) : (
          <div className="divide-y divide-white/10">
            {session.achievements.map((achievement) => (
              <div className="p-4" key={achievement.id}>
                <h3 className="font-medium text-slate-100">
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
      </SectionCard>
    </article>
  );
}
