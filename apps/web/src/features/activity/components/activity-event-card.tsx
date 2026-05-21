import type { ActivityEventResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/ui/status-badge';

const eventLabels: Record<ActivityEventResponseDto['eventType'], string> = {
  profile_synced: 'Profile synced',
  game_completed: 'Game completed',
  rare_achievement_synced: 'Rare achievement synced',
  guide_published: 'Guide published',
  guide_commented: 'Guide commented',
  guide_voted: 'Guide voted',
  session_created: 'Session created',
  session_joined: 'Session joined',
  session_commented: 'Session commented',
  milestone_reached: 'Milestone reached',
  badge_earned: 'Badge earned',
};

export function ActivityEventCard({
  event,
}: Readonly<{
  event: ActivityEventResponseDto;
}>): ReactNode {
  const actorName =
    event.actor?.displayName ??
    event.actor?.steamId ??
    event.steamProfile?.personaName ??
    event.steamProfile?.steamId ??
    'Steam profile';
  const actorHref = event.actor?.publicSlug
    ? `/u/${event.actor.publicSlug}`
    : event.actor?.steamId
      ? `/profiles/${event.actor.steamId}`
      : event.steamProfile?.steamId
        ? `/profiles/${event.steamProfile.steamId}`
        : null;
  const metadataTitle = getStringMetadata(event.metadata, 'title');
  const appHref = event.steamAppId ? `/games/${event.steamAppId}` : null;

  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 shadow-lg shadow-black/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
            {getEventGlyph(event.eventType)}
          </div>
          <div className="min-w-0">
            <StatusBadge tone="info">{eventLabels[event.eventType]}</StatusBadge>
            <p className="mt-2 text-sm leading-6 text-slate-300">
            {actorHref ? (
              <Link className="font-medium text-lime-200 hover:text-lime-100" href={actorHref}>
                {actorName}
              </Link>
            ) : (
              actorName
            )}
              {metadataTitle ? ` · ${metadataTitle}` : null}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              {appHref ? (
                <Link className="font-medium text-lime-200 hover:text-lime-100" href={appHref}>
                  App {event.steamAppId}
                </Link>
              ) : null}
              <span>{eventLabels[event.eventType]}</span>
            </div>
          </div>
        </div>
        <time className="text-xs text-slate-500" dateTime={event.occurredAt}>
          {formatDateTime(event.occurredAt)}
        </time>
      </div>
    </article>
  );
}

function getStringMetadata(metadata: object, key: string): string | null {
  if (!Object.prototype.hasOwnProperty.call(metadata, key)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getEventGlyph(eventType: ActivityEventResponseDto['eventType']): string {
  if (eventType === 'game_completed') {
    return '100';
  }

  if (eventType === 'rare_achievement_synced') {
    return 'RA';
  }

  if (eventType === 'guide_published' || eventType === 'guide_commented') {
    return 'GD';
  }

  if (eventType === 'session_created' || eventType === 'session_joined') {
    return 'SQ';
  }

  if (eventType === 'badge_earned' || eventType === 'milestone_reached') {
    return 'XP';
  }

  return 'ST';
}
