'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { useCreateGuide } from '@/features/guides/api/use-create-guide';
import {
  GuideForm,
  toCreateGuideDto,
  type GuideFormValues,
} from '@/features/guides/components/guide-form';
import { getErrorMessage } from '@/lib/format';

export default function NewGameGuidePage() {
  const params = useParams<{ steamAppId: string }>();
  const steamAppId = Number(params.steamAppId);
  const router = useRouter();
  const currentUser = useCurrentUser();
  const createGuide = useCreateGuide(steamAppId);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: GuideFormValues): Promise<void> {
    setError(null);
    try {
      const guide = await createGuide.mutateAsync(toCreateGuideDto(values));
      router.push(`/guides/${guide.id}/edit`);
    } catch (mutationError: unknown) {
      setError(getErrorMessage(mutationError));
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          className="text-sm font-medium text-blue-700"
          href={`/games/${steamAppId}/guides`}
        >
          Back to guides
        </Link>
        <AuthStatus />
      </div>
      <h1 className="mb-4 text-3xl font-semibold tracking-normal text-slate-950">
        Create guide
      </h1>
      {currentUser.isLoading ? <LoadingState message="Checking sign-in status..." /> : null}
      {currentUser.data === null ? (
        <ErrorState
          message="Sign in with Steam before creating guides."
          title="Sign in required"
        />
      ) : null}
      {currentUser.data ? (
        <div className="grid gap-4">
          {error ? <ErrorState message={error} title="Guide not saved" /> : null}
          <GuideForm
            isSubmitting={createGuide.isPending}
            onSubmit={(values) => void submit(values)}
            submitLabel="Create draft guide"
          />
        </div>
      ) : null}
    </main>
  );
}
