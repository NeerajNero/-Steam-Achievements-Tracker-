'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { useSession } from '@/features/sessions/api/use-session';
import { useUpdateSession } from '@/features/sessions/api/use-update-session';
import { SessionAchievementPicker } from '@/features/sessions/components/session-achievement-picker';
import {
  SessionForm,
  toUpdateSessionDto,
  type SessionFormValues,
} from '@/features/sessions/components/session-form';
import { getErrorMessage, getHttpStatus } from '@/lib/format';

export default function EditSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();
  const currentUser = useCurrentUser();
  const session = useSession(sessionId);
  const updateSession = useUpdateSession(sessionId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMissing = getHttpStatus(session.error) === 404;

  async function submit(values: SessionFormValues): Promise<void> {
    setErrorMessage(null);
    try {
      const updated = await updateSession.mutateAsync(toUpdateSessionDto(values));
      router.push(`/sessions/${updated.id}`);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-700" href={`/sessions/${sessionId}`}>
          Back to session
        </Link>
        <AuthStatus />
      </div>

      <h1 className="mb-4 text-3xl font-semibold tracking-normal text-slate-950">
        Edit session
      </h1>

      {currentUser.isLoading || session.isLoading ? (
        <LoadingState message="Loading session..." />
      ) : null}
      {!currentUser.isLoading && !currentUser.data ? (
        <ErrorState message="Sign in with Steam to edit sessions." title="Sign-in required" />
      ) : null}
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
      {currentUser.data && session.data ? (
        <div className="grid gap-6">
          <SessionForm
            initialSession={session.data}
            isSubmitting={updateSession.isPending}
            mode="edit"
            onSubmit={(values) => void submit(values)}
          />
          {errorMessage ? (
            <p className="text-sm text-red-700">{errorMessage}</p>
          ) : null}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Attach achievements</h2>
            <p className="mt-1 text-sm text-slate-600">
              Attach tracked achievement metadata for this Steam game.
            </p>
            <div className="mt-4">
              <SessionAchievementPicker
                sessionId={session.data.id}
                steamAppId={session.data.steamAppId}
              />
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
