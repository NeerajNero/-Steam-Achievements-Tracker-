'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { useAccountGuides } from '@/features/guides/api/use-account-guides';
import { useAddGuideAchievements } from '@/features/guides/api/use-add-guide-achievements';
import { useCreateGuideSection } from '@/features/guides/api/use-create-guide-section';
import { useUpdateGuide } from '@/features/guides/api/use-update-guide';
import { GuideAchievementPicker } from '@/features/guides/components/guide-achievement-picker';
import {
  GuideForm,
  toUpdateGuideDto,
  type GuideFormValues,
} from '@/features/guides/components/guide-form';
import { GuideSectionForm } from '@/features/guides/components/guide-section-form';
import { GuideStatusBadge } from '@/features/guides/components/guide-status-badge';
import { getErrorMessage } from '@/lib/format';

export default function EditGuidePage() {
  const params = useParams<{ guideId: string }>();
  const guideId = params.guideId;
  const guides = useAccountGuides();
  const updateGuide = useUpdateGuide(guideId);
  const createSection = useCreateGuideSection(guideId);
  const addAchievements = useAddGuideAchievements(guideId);
  const [message, setMessage] = useState<string | null>(null);
  const guide = useMemo(
    () => guides.data?.items.find((item) => item.id === guideId),
    [guideId, guides.data?.items],
  );

  async function submitGuide(values: GuideFormValues): Promise<void> {
    setMessage(null);
    try {
      await updateGuide.mutateAsync(toUpdateGuideDto(values));
      setMessage('Guide saved.');
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-700" href="/account/guides">
          Back to your guides
        </Link>
        <AuthStatus />
      </div>

      <h1 className="mb-6 text-3xl font-semibold tracking-normal text-slate-950">
        Edit guide
      </h1>

      {guides.isLoading ? <LoadingState message="Loading guide..." /> : null}
      {guides.data === null ? (
        <ErrorState message="Sign in with Steam to edit guides." title="Sign in required" />
      ) : null}
      {guides.isError ? (
        <ErrorState message={getErrorMessage(guides.error)} title="Guide unavailable" />
      ) : null}
      {guides.data && !guide ? (
        <EmptyState
          message="This guide was not found in your account guide list."
          title="Guide not found"
        />
      ) : null}

      {guide ? (
        <div className="grid gap-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600">
                  {guide.game.name} · Steam App {guide.steamAppId}
                </p>
                <h2 className="text-xl font-semibold text-slate-950">
                  {guide.title}
                </h2>
              </div>
              <GuideStatusBadge status={guide.status} />
            </div>
            {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
          </section>

          <GuideForm
            initialValues={{
              title: guide.title,
              summary: guide.summary ?? '',
              visibility: guide.visibility as GuideFormValues['visibility'],
              estimatedDifficulty: guide.estimatedDifficulty?.toString() ?? '',
              estimatedHours: guide.estimatedHours?.toString() ?? '',
              isSpoilerHeavy: guide.isSpoilerHeavy,
              status: guide.status as GuideFormValues['status'],
            }}
            isSubmitting={updateGuide.isPending}
            onSubmit={(values) => void submitGuide(values)}
            showStatus
            submitLabel="Save guide"
          />

          <GuideSectionForm
            isSubmitting={createSection.isPending}
            onSubmit={(values) => void createSection.mutateAsync(values)}
          />

          <GuideAchievementPicker
            isSubmitting={addAchievements.isPending}
            onSubmit={(achievementIds) =>
              void addAchievements.mutateAsync({ achievementIds })
            }
          />
        </div>
      ) : null}
    </main>
  );
}
