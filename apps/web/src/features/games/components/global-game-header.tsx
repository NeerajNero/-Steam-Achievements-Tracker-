import type { ReactNode } from 'react';

import type { GlobalGameMetadataResponseDto } from '@steam-achievement/client-sdk';

export function GlobalGameHeader({
  game,
}: Readonly<{
  game: GlobalGameMetadataResponseDto;
}>): ReactNode {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-4">
        {game.iconUrl ? (
          <img
            alt=""
            className="h-16 w-16 rounded-md border border-slate-200"
            src={game.iconUrl}
          />
        ) : (
          <div className="h-16 w-16 rounded-md border border-slate-200 bg-slate-100" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">Steam Game</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
            {game.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Steam App {game.steamAppId}</p>
          <p className="mt-1 text-sm text-slate-600">
            {game.hasAchievements ? 'Achievement metadata tracked' : 'No achievements tracked'}
          </p>
        </div>
      </div>
    </section>
  );
}
