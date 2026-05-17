import type { ReactNode } from 'react';

import { formatPercent } from '@/lib/format';

export function AchievementRarityBadge({
  isLocked,
  rarity,
}: Readonly<{
  isLocked: boolean;
  rarity: number;
}>): ReactNode {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        isLocked ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'
      }`}
      title={`${formatPercent(rarity)} rarity`}
    >
      {formatPercent(rarity)}
    </span>
  );
}
