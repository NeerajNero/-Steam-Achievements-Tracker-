'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
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
    <PageShell maxWidth="max-w-4xl">
      <PageHero
        actions={
          <Link
            className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            href={`/games/${steamAppId}/guides`}
          >
            Back to guides
          </Link>
        }
        eyebrow={`Steam App ${steamAppId}`}
        title="Create guide"
      >
        Draft a roadmap for achievements, collectibles, or co-op completion. Guide
        creation requires a Steam sign-in and stays private until you publish it.
      </PageHero>
      <div className="mt-6">
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
      </div>
    </PageShell>
  );
}
