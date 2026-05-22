'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useCreateSession } from '@/features/sessions/api/use-create-session';
import {
  SessionForm,
  toCreateSessionDto,
  type SessionFormValues,
} from '@/features/sessions/components/session-form';
import { getErrorMessage } from '@/lib/format';

export default function NewSessionPage() {
  const params = useParams<{ steamAppId: string }>();
  const steamAppId = Number(params.steamAppId);
  const router = useRouter();
  const currentUser = useCurrentUser();
  const createSession = useCreateSession(steamAppId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(values: SessionFormValues): Promise<void> {
    setErrorMessage(null);
    try {
      const session = await createSession.mutateAsync(toCreateSessionDto(values));
      router.push(`/sessions/${session.id}`);
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
            href={`/games/${steamAppId}/sessions`}
          >
            Back to sessions
          </Link>
        }
        eyebrow={`Steam App ${steamAppId}`}
        title="New session"
      >
        Schedule a Steam achievement session and coordinate the target unlocks, roster size, and voice link in one pass.
      </PageHero>

      <div className="mt-6">
      {currentUser.isLoading ? <LoadingState message="Checking sign-in..." /> : null}
      {!currentUser.isLoading && !currentUser.data ? (
        <ErrorState
          message="Sign in with Steam to create scheduled game sessions."
          title="Sign-in required"
        />
      ) : null}
      {currentUser.data ? (
        <div className="grid gap-4">
          <SessionForm
            isSubmitting={createSession.isPending}
            mode="create"
            onSubmit={(values) => void submit(values)}
          />
          {errorMessage ? (
            <ErrorState message={errorMessage} title="Session not saved" />
          ) : null}
        </div>
      ) : null}
      </div>
    </PageShell>
  );
}
