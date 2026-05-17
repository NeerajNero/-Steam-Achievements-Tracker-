import type { ShowcaseItemResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { BadgeCard } from '@/features/badges/components/badge-card';

export function ShowcaseItemCard({
  item,
}: Readonly<{
  item: ShowcaseItemResponseDto;
}>): ReactNode {
  const title = item.titleOverride ?? getDefaultTitle(item);

  if (item.profileBadge) {
    return (
      <div>
        <BadgeCard
          badge={item.profileBadge.badge}
          earnedAt={item.profileBadge.earnedAt}
        />
      </div>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs uppercase tracking-normal text-slate-500">
        {item.itemType.replace('_', ' ')}
      </p>
      {item.milestone ? (
        <p className="mt-3 text-sm text-slate-400">{item.milestone.description}</p>
      ) : null}
      {item.achievement ? (
        <p className="mt-3 text-sm text-slate-400">
          App {item.achievement.steamAppId}
        </p>
      ) : null}
      {item.guide ? (
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-lime-200 hover:text-lime-100"
          href={`/games/${item.guide.steamAppId}/guides/${item.guide.slug}`}
        >
          Open guide
        </Link>
      ) : null}
      {item.gamingSession ? (
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-lime-200 hover:text-lime-100"
          href={`/sessions/${item.gamingSession.id}`}
        >
          Open session
        </Link>
      ) : null}
    </article>
  );
}

function getDefaultTitle(item: ShowcaseItemResponseDto): string {
  if (item.badge) {
    return item.badge.name;
  }

  if (item.milestone) {
    return item.milestone.title;
  }

  if (item.achievement) {
    return item.achievement.displayName ?? item.achievement.apiName;
  }

  if (item.guide) {
    return item.guide.title;
  }

  if (item.gamingSession) {
    return item.gamingSession.title;
  }

  return 'Showcase item';
}
