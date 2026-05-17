'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useGlobalGameAchievements } from '@/features/games/api/use-global-game-achievements';
import { useAddSessionAchievements } from '@/features/sessions/api/use-add-session-achievements';
import { getErrorMessage } from '@/lib/format';

export function SessionAchievementPicker({
  sessionId,
  steamAppId,
}: Readonly<{
  sessionId: string;
  steamAppId: number;
}>): ReactNode {
  const achievements = useGlobalGameAchievements(steamAppId, {
    hidden: 'all',
    sort: 'rarity',
    order: 'asc',
    limit: 100,
    offset: 0,
  });
  const addAchievements = useAddSessionAchievements(sessionId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleAchievement(achievementId: string): void {
    setSelectedIds((current) =>
      current.includes(achievementId)
        ? current.filter((id) => id !== achievementId)
        : [...current, achievementId],
    );
  }

  if (achievements.isLoading) {
    return <LoadingState message="Loading achievement metadata..." />;
  }

  if (achievements.isError) {
    return (
      <ErrorState
        message={getErrorMessage(achievements.error)}
        title="Achievements unavailable"
      />
    );
  }

  const items = achievements.data?.items ?? [];

  if (items.length === 0) {
    return <EmptyState message="No achievement metadata is available." />;
  }

  return (
    <div className="grid gap-3">
      <div className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-slate-950/60">
        {items.map((achievement) => (
          <label
            className="flex cursor-pointer items-start gap-3 border-b border-white/10 p-3 text-sm last:border-0 hover:bg-white/5"
            key={achievement.id}
          >
            <input
              checked={selectedIds.includes(achievement.id)}
              className="mt-1"
              onChange={() => toggleAchievement(achievement.id)}
              type="checkbox"
            />
            <span>
              <span className="block font-medium text-slate-100">
                {achievement.displayName ?? achievement.apiName}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {achievement.globalPercentage === null ||
                achievement.globalPercentage === undefined
                  ? 'Rarity unknown'
                  : `${achievement.globalPercentage.toFixed(1)}% global unlocks`}
                {achievement.hidden ? ' · Hidden' : ''}
              </span>
            </span>
          </label>
        ))}
      </div>
      <button
        className="w-fit rounded-xl bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-60"
        disabled={selectedIds.length === 0 || addAchievements.isPending}
        onClick={() =>
          void addAchievements
            .mutateAsync({ achievementIds: selectedIds })
            .then(() => setSelectedIds([]))
        }
        type="button"
      >
        {addAchievements.isPending ? 'Attaching...' : 'Attach achievements'}
      </button>
      {addAchievements.isError ? (
        <p className="text-sm text-red-300">{getErrorMessage(addAchievements.error)}</p>
      ) : null}
    </div>
  );
}
