'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionCard } from '@/components/ui/section-card';
import { SummaryCard } from '@/components/ui/summary-card';
import { asPublicProfileSettings } from '@/features/account/utils/settings';
import { useProfileActivity } from '@/features/activity/api/use-profile-activity';
import { ActivityFeed } from '@/features/activity/components/activity-feed';
import { useProfileBadges } from '@/features/badges/api/use-profile-badges';
import { BadgeGrid } from '@/features/badges/components/badge-grid';
import { useProfileMilestones } from '@/features/milestones/api/use-profile-milestones';
import { MilestonesList } from '@/features/milestones/components/milestones-list';
import { useProfileShowcase } from '@/features/showcase/api/use-profile-showcase';
import { ProfileShowcase } from '@/features/showcase/components/profile-showcase';

import { usePublicProfile } from '../api/use-public-profile';

export function PublicProfileView({
  slug,
}: Readonly<{
  slug: string;
}>): ReactNode {
  const profile = usePublicProfile(slug);
  const steamId = profile.data?.steamProfile.steamId ?? '';
  const activity = useProfileActivity(steamId, { limit: 5, offset: 0 });
  const milestones = useProfileMilestones(steamId, { limit: 5, offset: 0 });
  const badges = useProfileBadges(steamId);
  const showcase = useProfileShowcase(steamId);

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
      <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.2),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/30 md:p-8">
        <div className="flex flex-wrap items-center gap-4">
          {data.steamProfile.avatarUrl ? (
            <img
              alt=""
              className="h-20 w-20 rounded-2xl border border-white/10"
              src={data.steamProfile.avatarUrl}
            />
          ) : null}
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-white md:text-5xl">
              {displayName}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Public profile: /u/{data.publicProfile.slug}
            </p>
            {data.steamProfile.steamId ? (
              <p className="mt-1 text-sm text-slate-400">
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

      <SectionCard title="Nearest Completions">
        {data.nearestCompletions.length === 0 ? (
          <EmptyState message="No near-completion games found." />
        ) : (
          <div className="divide-y divide-white/10">
            {data.nearestCompletions.map((game) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                key={game.steamAppId}
              >
                <div>
                  <Link
                    className="font-medium text-lime-200 hover:text-lime-100"
                    href={`/games/${game.steamAppId}`}
                  >
                    {game.name}
                  </Link>
                  <p className="text-sm text-slate-400">
                    {game.remainingAchievements} remaining
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {game.completionPercentage}%
                </span>
                <div className="w-32">
                  <ProgressBar value={game.completionPercentage} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {settings.showRarestAchievements === false ? null : (
        <SectionCard title="Rarest Achievements">
          {data.rarestAchievements.length === 0 ? (
            <EmptyState message="No rare unlocked achievements available yet." />
          ) : (
            <div className="divide-y divide-white/10">
              {data.rarestAchievements.map((achievement) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                  key={`${achievement.steamAppId}-${achievement.apiName}`}
                >
                  <div>
                    <p className="font-medium text-white">
                      {achievement.displayName ?? achievement.apiName}
                    </p>
                    <p className="text-sm text-slate-400">
                      App {achievement.steamAppId}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-lime-100">
                    {achievement.globalPercentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {data.steamProfile.steamId ? (
        <>
          <ProfileShowcase
            error={showcase.error}
            isError={showcase.isError}
            isLoading={showcase.isLoading}
            items={showcase.data?.items}
          />
          <BadgeGrid
            badges={badges.data?.items}
            error={badges.error}
            isError={badges.isError}
            isLoading={badges.isLoading}
            title="Badges"
          />
          <MilestonesList
            error={milestones.error}
            isError={milestones.isError}
            isLoading={milestones.isLoading}
            milestones={milestones.data?.items}
            title="Milestones"
          />
          <ActivityFeed
            error={activity.error}
            isError={activity.isError}
            isLoading={activity.isLoading}
            items={activity.data?.items}
            title="Recent activity"
          />
        </>
      ) : null}

      {data.steamProfile.steamId ? (
        <Link
          className="inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          href={`/profiles/${data.steamProfile.steamId}`}
        >
          Open full dashboard
        </Link>
      ) : null}
    </div>
  );
}
