'use client';

import {
  ListProfileGamesOrderEnum,
  ListProfileGamesSortEnum,
  type QueuedSyncResponseDto,
  SyncRequestDtoScopeEnum,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useEnqueueSync } from '@/features/profile/api/use-enqueue-sync';
import { useNearestCompletions } from '@/features/profile/api/use-nearest-completions';
import { useProfile } from '@/features/profile/api/use-profile';
import { useProfileGames } from '@/features/profile/api/use-profile-games';
import { useProfileSummary } from '@/features/profile/api/use-profile-summary';
import { useRarestAchievements } from '@/features/profile/api/use-rarest-achievements';
import { useSyncRuns } from '@/features/profile/api/use-sync-runs';
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPlaytime,
  getErrorMessage,
} from '@/lib/format';

export default function ProfilePage() {
  const params = useParams<{ steamId: string }>();
  const steamId = params.steamId;
  const [queuedSync, setQueuedSync] = useState<QueuedSyncResponseDto | null>(
    null,
  );
  const [achievementAppIds, setAchievementAppIds] = useState('');

  const profile = useProfile(steamId);
  const summary = useProfileSummary(steamId);
  const games = useProfileGames(steamId, {
    limit: 25,
    sort: ListProfileGamesSortEnum.Completion,
    order: ListProfileGamesOrderEnum.Desc,
  });
  const nearestCompletions = useNearestCompletions(steamId, 5);
  const rarestAchievements = useRarestAchievements(steamId, 5);
  const syncRuns = useSyncRuns(steamId, 8);
  const enqueueSync = useEnqueueSync(steamId);

  const parsedAchievementAppIds = useMemo(
    () => parseAppIds(achievementAppIds),
    [achievementAppIds],
  );

  async function enqueue(scope: SyncRequestDtoScopeEnum): Promise<void> {
    const response = await enqueueSync.mutateAsync({
      scope,
      appIds:
        scope === SyncRequestDtoScopeEnum.Achievements
          ? parsedAchievementAppIds
          : undefined,
    });
    setQueuedSync(response);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link className="text-sm font-medium text-blue-700" href="/">
            Back to search
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            {summary.data?.personaName ?? profile.data?.personaName ?? steamId}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Steam ID: {steamId}</p>
        </div>
        {profile.data?.avatarUrl ? (
          <img
            alt=""
            className="h-16 w-16 rounded-md border border-slate-200"
            src={profile.data.avatarUrl}
          />
        ) : null}
      </div>

      {summary.isError || profile.isError ? (
        <ErrorPanel
          message={getErrorMessage(summary.error ?? profile.error)}
          title="Profile data is unavailable"
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Games"
          loading={summary.isLoading}
          value={summary.data ? formatNumber(summary.data.totalGames) : '-'}
        />
        <SummaryCard
          label="Completed"
          loading={summary.isLoading}
          value={summary.data ? formatNumber(summary.data.completedGames) : '-'}
        />
        <SummaryCard
          label="Achievements"
          loading={summary.isLoading}
          value={
            summary.data
              ? `${formatNumber(summary.data.unlockedAchievements)} / ${formatNumber(summary.data.totalAchievements)}`
              : '-'
          }
        />
        <SummaryCard
          label="Average Completion"
          loading={summary.isLoading}
          value={
            summary.data
              ? formatPercent(summary.data.averageCompletionPercentage)
              : '-'
          }
        />
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Sync</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Jobs are queued in the backend. Status refreshes through sync
              runs below.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SyncButton
              disabled={enqueueSync.isPending}
              label="Sync Profile"
              onClick={() => void enqueue(SyncRequestDtoScopeEnum.Profile)}
            />
            <SyncButton
              disabled={enqueueSync.isPending}
              label="Sync Games"
              onClick={() => void enqueue(SyncRequestDtoScopeEnum.Games)}
            />
            <SyncButton
              disabled={enqueueSync.isPending}
              label="Sync Achievements"
              onClick={() => void enqueue(SyncRequestDtoScopeEnum.Achievements)}
            />
          </div>
        </div>
        <label className="mt-4 grid max-w-lg gap-2">
          <span className="text-sm font-medium text-slate-700">
            Achievement app IDs, optional
          </span>
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            onChange={(event) => setAchievementAppIds(event.target.value)}
            placeholder="910001,910002"
            value={achievementAppIds}
          />
        </label>
        {queuedSync ? (
          <p className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">
            Queued {queuedSync.scope} sync run {queuedSync.syncRunId}.
          </p>
        ) : null}
        {enqueueSync.isError ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {getErrorMessage(enqueueSync.error)}
          </p>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-semibold text-slate-950">Games</h2>
            <p className="mt-1 text-sm text-slate-600">
              Showing the first {games.data?.items.length ?? 0} of{' '}
              {games.data?.total ?? 0} stored games.
            </p>
          </div>
          {games.isLoading ? <PanelState message="Loading games..." /> : null}
          {games.isError ? (
            <PanelState message={getErrorMessage(games.error)} tone="error" />
          ) : null}
          {games.data && games.data.items.length === 0 ? (
            <PanelState message="No games have been synced for this profile." />
          ) : null}
          {games.data && games.data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Game</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Playtime</th>
                    <th className="px-4 py-3">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {games.data.items.map((game) => (
                    <tr key={game.steamAppId}>
                      <td className="px-4 py-3">
                        <Link
                          className="font-medium text-blue-700 hover:text-blue-900"
                          href={`/profiles/${steamId}/games/${game.steamAppId}`}
                        >
                          {game.name}
                        </Link>
                        <div className="text-xs text-slate-500">
                          App {game.steamAppId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {formatPercent(game.completionPercentage)}
                        <div className="text-xs text-slate-500">
                          {game.unlockedAchievements}/{game.totalAchievements}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {formatPlaytime(game.playtimeMinutes)}
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(game.remainingAchievements)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <aside className="grid content-start gap-6">
          <SmallListPanel
            emptyMessage="No near-completion games yet."
            error={nearestCompletions.error}
            isError={nearestCompletions.isError}
            isLoading={nearestCompletions.isLoading}
            title="Nearest 100%"
          >
            {nearestCompletions.data?.items.map((game) => (
              <li className="rounded-md border border-slate-200 p-3" key={game.steamAppId}>
                <Link
                  className="font-medium text-blue-700"
                  href={`/profiles/${steamId}/games/${game.steamAppId}`}
                >
                  {game.name}
                </Link>
                <div className="mt-1 text-sm text-slate-600">
                  {formatPercent(game.completionPercentage)} complete,
                  {' '}
                  {formatNumber(game.remainingAchievements)} remaining
                </div>
              </li>
            ))}
          </SmallListPanel>

          <SmallListPanel
            emptyMessage="No rare unlocked achievements yet."
            error={rarestAchievements.error}
            isError={rarestAchievements.isError}
            isLoading={rarestAchievements.isLoading}
            title="Rarest Achievements"
          >
            {rarestAchievements.data?.items.map((achievement) => (
              <li
                className="rounded-md border border-slate-200 p-3"
                key={`${achievement.steamAppId}-${achievement.apiName}`}
              >
                <div className="font-medium text-slate-900">
                  {achievement.displayName ?? achievement.apiName}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  App {achievement.steamAppId} ·{' '}
                  {formatPercent(achievement.globalPercentage)}
                </div>
              </li>
            ))}
          </SmallListPanel>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-xl font-semibold text-slate-950">
                Sync Runs
              </h2>
            </div>
            {syncRuns.isLoading ? (
              <PanelState message="Loading sync runs..." />
            ) : null}
            {syncRuns.isError ? (
              <PanelState
                message={getErrorMessage(syncRuns.error)}
                tone="error"
              />
            ) : null}
            {syncRuns.data?.items.length === 0 ? (
              <PanelState message="No sync runs recorded yet." />
            ) : null}
            {syncRuns.data && syncRuns.data.items.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {syncRuns.data.items.map((run) => (
                  <li className="p-4" key={run.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium capitalize text-slate-900">
                        {run.syncType}
                      </span>
                      <span className={statusBadgeClassName(run.status)}>
                        {run.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Started {formatDateTime(run.startedAt)}
                    </div>
                    {run.errorMessage ? (
                      <div className="mt-2 text-sm text-red-700">
                        {run.errorMessage}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  loading,
  value,
}: Readonly<{
  label: string;
  loading: boolean;
  value: string;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">
        {loading ? '...' : value}
      </div>
    </article>
  );
}

function SyncButton({
  disabled,
  label,
  onClick,
}: Readonly<{
  disabled: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ErrorPanel({
  message,
  title,
}: Readonly<{ message: string; title: string }>) {
  return (
    <section className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm">{message}</p>
    </section>
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
          ? 'p-5 text-sm text-red-700'
          : 'p-5 text-sm text-slate-500'
      }
    >
      {message}
    </div>
  );
}

function SmallListPanel({
  children,
  emptyMessage,
  error,
  isError,
  isLoading,
  title,
}: Readonly<{
  children: React.ReactNode;
  emptyMessage: string;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  title: string;
}>) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      </div>
      {isLoading ? <PanelState message="Loading..." /> : null}
      {isError ? (
        <PanelState message={getErrorMessage(error)} tone="error" />
      ) : null}
      {!isLoading && !isError && !hasItems ? (
        <PanelState message={emptyMessage} />
      ) : null}
      {hasItems ? <ul className="grid gap-3 p-4">{children}</ul> : null}
    </section>
  );
}

function parseAppIds(value: string): number[] | undefined {
  const appIds = value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((appId) => Number.isInteger(appId) && appId > 0);

  return appIds.length === 0 ? undefined : appIds;
}

function statusBadgeClassName(status: string): string {
  const base =
    'rounded-full px-2.5 py-1 text-xs font-semibold capitalize tracking-normal';

  if (status === 'success') {
    return `${base} bg-emerald-50 text-emerald-700`;
  }

  if (status === 'partial_success' || status === 'running') {
    return `${base} bg-amber-50 text-amber-700`;
  }

  if (status === 'failed') {
    return `${base} bg-red-50 text-red-700`;
  }

  return `${base} bg-slate-100 text-slate-700`;
}
