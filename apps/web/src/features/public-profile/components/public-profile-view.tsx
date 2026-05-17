'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SummaryCard } from '@/components/ui/summary-card';
import { asPublicProfileSettings } from '@/features/account/utils/settings';

import { usePublicProfile } from '../api/use-public-profile';

export function PublicProfileView({
  slug,
}: Readonly<{
  slug: string;
}>): ReactNode {
  const profile = usePublicProfile(slug);

  if (profile.isLoading) {
    return <LoadingState message="Loading public profile..." />;
  }

  if (profile.isError) {
    const message =
      profile.error instanceof Error
        ? profile.error.message
        : 'Unable to load public profile.';

    return <ErrorState message={message} title="Unable to load public profile" />;
  }

  if (!profile.data) {
    return (
      <EmptyState
        message="This profile does not exist or is not currently public."
        title="Public profile not found"
      />
    );
  }

  const data = profile.data;
  const settings = asPublicProfileSettings(data.publicProfile.settings);
  const displayName = data.steamProfile.personaName ?? data.publicProfile.slug;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {data.steamProfile.avatarUrl ? (
            <img
              alt=""
              className="h-16 w-16 rounded-full border border-slate-200"
              src={data.steamProfile.avatarUrl}
            />
          ) : null}
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              {displayName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Public profile: /u/{data.publicProfile.slug}
            </p>
            {data.steamProfile.steamId ? (
              <p className="mt-1 text-sm text-slate-600">
                Steam ID: {data.steamProfile.steamId}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Games" value={String(data.summary.totalGames)} />
        <SummaryCard
          label="Completed"
          value={String(data.summary.completedGames)}
        />
        <SummaryCard
          label="Achievements"
          value={`${data.summary.unlockedAchievements}/${data.summary.totalAchievements}`}
        />
        <SummaryCard
          label="Average"
          value={`${data.summary.averageCompletionPercentage}%`}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Nearest Completions</h2>
        {data.nearestCompletions.length === 0 ? (
          <EmptyState message="No near-completion games found." />
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {data.nearestCompletions.map((game) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                key={game.steamAppId}
              >
                <div>
                  <Link
                    className="font-medium text-blue-700 hover:text-blue-900"
                    href={`/games/${game.steamAppId}`}
                  >
                    {game.name}
                  </Link>
                  <p className="text-sm text-slate-600">
                    {game.remainingAchievements} remaining
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {game.completionPercentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {settings.showRarestAchievements === false ? null : (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Rarest Achievements</h2>
          {data.rarestAchievements.length === 0 ? (
            <EmptyState message="No rare unlocked achievements available yet." />
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {data.rarestAchievements.map((achievement) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                  key={`${achievement.steamAppId}-${achievement.apiName}`}
                >
                  <div>
                    <p className="font-medium text-slate-950">
                      {achievement.displayName ?? achievement.apiName}
                    </p>
                    <p className="text-sm text-slate-600">
                      App {achievement.steamAppId}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {achievement.globalPercentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {data.steamProfile.steamId ? (
        <Link
          className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={`/profiles/${data.steamProfile.steamId}`}
        >
          Open full dashboard
        </Link>
      ) : null}
    </div>
  );
}
