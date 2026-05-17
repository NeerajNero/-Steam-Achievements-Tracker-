'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { PageShell } from '@/components/layout/page-shell';
import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { SessionCommunitySection } from '@/features/community/components/session-community-section';
import { useSession } from '@/features/sessions/api/use-session';
import { SessionDetail } from '@/features/sessions/components/session-detail';
import { getErrorMessage, getHttpStatus } from '@/lib/format';

export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const session = useSession(sessionId);
  const currentUser = useCurrentUser();
  const isMissing = getHttpStatus(session.error) === 404;
  const userId = currentUser.data?.user.id;
  const canManage =
    session.data !== undefined &&
    userId !== undefined &&
    session.data.participants.some(
      (participant) =>
        participant.role === 'host' &&
        participant.status === 'joined' &&
        participant.user.steamId === currentUser.data?.steamAccount?.steamId,
    );

  return (
    <PageShell>
      <div className="mb-4">
        <Link className="text-sm font-medium text-lime-200 hover:text-lime-100" href="/sessions">
          Back to sessions
        </Link>
      </div>

      {session.isLoading ? <LoadingState message="Loading session..." /> : null}
      {isMissing ? (
        <ErrorState
          message="This session is not public, or it does not exist."
          title="Session not found"
        />
      ) : null}
      {!isMissing && session.isError ? (
        <ErrorState
          message={getErrorMessage(session.error)}
          title="Session unavailable"
        />
      ) : null}
      {session.data ? (
        <div className="grid gap-6">
          <SessionDetail
            canManage={canManage}
            isAuthenticated={Boolean(currentUser.data)}
            session={session.data}
          />
          <SessionCommunitySection sessionId={session.data.id} />
        </div>
      ) : null}
    </PageShell>
  );
}
