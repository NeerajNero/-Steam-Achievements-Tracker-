import type { BadgeResponseDto, ProfileBadgeResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { BadgeTierBadge } from './badge-tier-badge';

export function BadgeCard({
  badge,
  earnedAt,
}: Readonly<{
  badge: BadgeResponseDto;
  earnedAt?: string | null;
}>): ReactNode {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{badge.name}</p>
          <p className="mt-1 text-xs uppercase tracking-normal text-slate-500">
            {badge.code}
          </p>
        </div>
        <BadgeTierBadge tier={badge.tier} />
      </div>
      {badge.description ? (
        <p className="mt-3 text-sm text-slate-400">{badge.description}</p>
      ) : null}
      {earnedAt ? (
        <p className="mt-3 text-xs text-slate-500">
          Earned {new Date(earnedAt).toLocaleDateString()}
        </p>
      ) : null}
    </article>
  );
}

export function ProfileBadgeCard({
  profileBadge,
}: Readonly<{
  profileBadge: ProfileBadgeResponseDto;
}>): ReactNode {
  return <BadgeCard badge={profileBadge.badge} earnedAt={profileBadge.earnedAt} />;
}
