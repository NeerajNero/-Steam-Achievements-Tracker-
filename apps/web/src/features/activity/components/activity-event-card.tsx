import type { ActivityEventResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

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

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StatusBadge tone="info">{eventLabels[event.eventType]}</StatusBadge>
          <p className="mt-2 text-sm text-slate-300">
            {actorHref ? (
              <Link className="font-medium text-lime-200 hover:text-lime-100" href={actorHref}>
                {actorName}
              </Link>
            ) : (
              actorName
            )}
            {metadataTitle ? ` - ${metadataTitle}` : null}
          </p>
          {event.steamAppId ? (
            <Link
              className="mt-2 inline-flex text-xs font-medium text-lime-200 hover:text-lime-100"
              href={`/games/${event.steamAppId}`}
            >
              App {event.steamAppId}
            </Link>
          ) : null}
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
import { StatusBadge } from '@/components/ui/status-badge';
