import { GameTargetButton } from '@/features/targets/components/target-button';
import type { ReactNode } from 'react';

import type { GlobalGameMetadataResponseDto } from '@steam-achievement/client-sdk';
import { MetadataStateBadge } from '@/components/ui/metadata-state-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { getAchievementMetadataStateDescription } from '@/utils/metadata-state';

export function GlobalGameHeader({
  game,
}: Readonly<{
  game: GlobalGameMetadataResponseDto;
}>): ReactNode {
  return (
    <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.2),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/30 md:p-8">
      <div className="flex flex-wrap items-start gap-4">
        {game.iconUrl ? (
          <img
            alt=""
            className="h-20 w-20 rounded-2xl border border-white/10"
            src={game.iconUrl}
          />
        ) : (
          <div className="h-20 w-20 rounded-2xl border border-white/10 bg-white/5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="accent">Steam Game</StatusBadge>
            <MetadataStateBadge state={game.achievementDataState} />
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white md:text-5xl">
            {game.name}
          </h1>
          <p className="mt-2 text-sm text-slate-300">Steam App {game.steamAppId}</p>
          <p className="mt-1 text-sm text-slate-400">
            {getAchievementMetadataStateDescription(game.achievementDataState)}
          </p>
          <div className="mt-4">
            <GameTargetButton steamAppId={game.steamAppId} />
          </div>
        </div>
      </div>
    </section>
  );
}
