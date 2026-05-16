'use client';

import {
  AchievementWithUnlockStateResponseDtoUnlockStateEnum,
  ListGameAchievementsOrderEnum,
  ListGameAchievementsSortEnum,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useGameAchievements } from '@/features/profile/api/use-game-achievements';
import { useProfileGame } from '@/features/profile/api/use-profile-game';
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPlaytime,
  getErrorMessage,
} from '@/lib/format';

export default function GameDetailPage() {
  const params = useParams<{ steamId: string; steamAppId: string }>();
  const steamId = params.steamId;
  const steamAppId = Number(params.steamAppId);

  const game = useProfileGame(steamId, steamAppId);
  const achievements = useGameAchievements(steamId, steamAppId, {
    sort: ListGameAchievementsSortEnum.Rarity,
    order: ListGameAchievementsOrderEnum.Asc,
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <Link
        className="text-sm font-medium text-blue-700"
        href={`/profiles/${steamId}`}
      >
        Back to profile
      </Link>

      {game.isLoading ? (
        <PanelState message="Loading game..." />
      ) : null}
      {game.isError ? (
        <PanelState message={getErrorMessage(game.error)} tone="error" />
      ) : null}

      {game.data ? (
        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            {game.data.iconUrl ? (
              <img
                alt=""
                className="h-16 w-16 rounded-md border border-slate-200"
                src={game.data.iconUrl}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">
                App {game.data.steamAppId}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
                {game.data.name}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Last synced {formatDateTime(game.data.lastSyncedAt)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Metric
              label="Completion"
              value={formatPercent(game.data.completionPercentage)}
            />
            <Metric
              label="Achievements"
              value={`${formatNumber(game.data.unlockedAchievements)} / ${formatNumber(game.data.totalAchievements)}`}
            />
            <Metric
              label="Remaining"
              value={formatNumber(game.data.remainingAchievements)}
            />
            <Metric
              label="Playtime"
              value={formatPlaytime(game.data.playtimeMinutes)}
            />
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-semibold text-slate-950">
            Achievements
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Unknown unlock state means metadata exists but Steam did not provide
            player unlock state. It is not treated as definitely locked.
          </p>
        </div>
        {achievements.isLoading ? (
          <PanelState message="Loading achievements..." />
        ) : null}
        {achievements.isError ? (
          <PanelState
            message={getErrorMessage(achievements.error)}
            tone="error"
          />
        ) : null}
        {achievements.data?.items.length === 0 ? (
          <PanelState message="No achievements are stored for this game." />
        ) : null}
        {achievements.data && achievements.data.items.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {achievements.data.items.map((achievement) => (
              <li
                className="grid gap-4 p-4 md:grid-cols-[48px_1fr_auto]"
                key={achievement.apiName}
              >
                {achievement.iconUrl || achievement.iconGrayUrl ? (
                  <img
                    alt=""
                    className="h-12 w-12 rounded-md border border-slate-200"
                    src={achievement.iconUrl ?? achievement.iconGrayUrl ?? ''}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md border border-slate-200 bg-slate-100" />
                )}
                <div>
                  <div className="font-medium text-slate-950">
                    {achievement.displayName ?? achievement.apiName}
                  </div>
                  {achievement.description ? (
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {achievement.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{achievement.apiName}</span>
                    {achievement.hidden ? <span>Hidden</span> : null}
                    <span>
                      Rarity:{' '}
                      {achievement.globalPercentage === undefined ||
                      achievement.globalPercentage === null
                        ? 'Unknown'
                        : formatPercent(achievement.globalPercentage)}
                    </span>
                  </div>
                </div>
                <div className="md:text-right">
                  <span
                    className={unlockStateBadgeClassName(
                      achievement.unlockState,
                    )}
                  >
                    {unlockStateLabel(achievement.unlockState)}
                  </span>
                  {achievement.unlockedAt ? (
                    <div className="mt-2 text-xs text-slate-500">
                      {formatDateTime(achievement.unlockedAt)}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-950">{value}</div>
    </article>
  );
}

function PanelState({
  message,
  tone = 'default',
}: Readonly<{ message: string; tone?: 'default' | 'error' }>) {
  return (
    <div
      className={
        tone === 'error'
          ? 'rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700'
          : 'p-5 text-sm text-slate-500'
      }
    >
      {message}
    </div>
  );
}

function unlockStateLabel(
  unlockState: AchievementWithUnlockStateResponseDtoUnlockStateEnum,
): string {
  if (
    unlockState === AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unknown
  ) {
    return 'Unknown unlock state';
  }

  return unlockState;
}

function unlockStateBadgeClassName(
  unlockState: AchievementWithUnlockStateResponseDtoUnlockStateEnum,
): string {
  const base =
    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize tracking-normal';

  if (
    unlockState === AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unlocked
  ) {
    return `${base} bg-emerald-50 text-emerald-700`;
  }

  if (
    unlockState === AchievementWithUnlockStateResponseDtoUnlockStateEnum.Unknown
  ) {
    return `${base} bg-amber-50 text-amber-800`;
  }

  return `${base} bg-slate-100 text-slate-700`;
}
