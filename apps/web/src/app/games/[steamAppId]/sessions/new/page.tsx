'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { AuthStatus } from '@/features/auth/components/auth-status';
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
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          className="text-sm font-medium text-blue-700"
          href={`/games/${steamAppId}/sessions`}
        >
          Back to sessions
        </Link>
        <AuthStatus />
      </div>

      <h1 className="mb-4 text-3xl font-semibold tracking-normal text-slate-950">
        New session
      </h1>

      {currentUser.isLoading ? <LoadingState message="Checking sign-in..." /> : null}
      {!currentUser.isLoading && !currentUser.data ? (
        <ErrorState
          message="Sign in with Steam to create scheduled game sessions."
          title="Sign-in required"
        />
      ) : null}
      {currentUser.data ? (
        <>
          <SessionForm
            isSubmitting={createSession.isPending}
            mode="create"
            onSubmit={(values) => void submit(values)}
          />
          {errorMessage ? (
            <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
