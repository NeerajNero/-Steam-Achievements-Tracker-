import type {
  GetLeaderboardTypeEnum,
  LeaderboardTypeResponseDto,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  getLeaderboardDescription,
  getLeaderboardLabel,
} from '../utils/leaderboard-types';

export function LeaderboardTabs({
  activeType,
  items,
}: Readonly<{
  activeType?: GetLeaderboardTypeEnum;
  items: LeaderboardTypeResponseDto[];
}>): ReactNode {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const isActive = item.type === activeType;

        return (
          <Link
            className={`rounded-2xl border p-4 shadow-xl shadow-black/20 ${
              isActive
                ? 'border-lime-300/50 bg-lime-400/10 text-lime-100'
                : 'border-white/10 bg-slate-950/70 text-white hover:border-lime-300/30 hover:bg-slate-900'
            }`}
            href={`/leaderboards/${item.type}`}
            key={item.type}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Leaderboard
              </div>
              {isActive ? (
                <span className="rounded-full border border-lime-300/30 bg-lime-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-lime-100">
                  Active
                </span>
              ) : null}
            </div>
            <div className="mt-3 font-semibold">{getLeaderboardLabel(item.type)}</div>
            <p className="mt-1 text-sm leading-5 text-slate-400">
              {getLeaderboardDescription(item.type)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
