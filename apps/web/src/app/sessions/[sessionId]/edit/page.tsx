'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
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
    <PageShell maxWidth="max-w-5xl">
      <PageHero
        actions={
          <Link
            className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            href={`/sessions/${sessionId}`}
          >
            Back to session
          </Link>
        }
        eyebrow="Host tools"
        title="Edit session"
      >
        Update schedule, visibility, capacity, status, and target achievements from one host view.
      </PageHero>

      <div className="mt-6">
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
            <ErrorState message={errorMessage} title="Session not saved" />
          ) : null}
          <SectionCard>
            <h2 className="font-semibold text-white">Attach achievements</h2>
            <p className="mt-1 text-sm text-slate-400">
              Attach tracked achievement metadata for this Steam game.
            </p>
            <div className="mt-4">
              <SessionAchievementPicker
                sessionId={session.data.id}
                steamAppId={session.data.steamAppId}
              />
            </div>
          </SectionCard>
        </div>
      ) : null}
      </div>
    </PageShell>
  );
}
