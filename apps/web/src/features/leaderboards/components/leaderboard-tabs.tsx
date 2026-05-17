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
            className={`rounded-lg border p-4 shadow-sm ${
              isActive
                ? 'border-blue-300 bg-blue-50 text-blue-950'
                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
            }`}
            href={`/leaderboards/${item.type}`}
            key={item.type}
          >
            <div className="font-semibold">{getLeaderboardLabel(item.type)}</div>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {getLeaderboardDescription(item.type)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
