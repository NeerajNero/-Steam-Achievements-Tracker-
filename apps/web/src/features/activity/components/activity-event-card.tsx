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
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {eventLabels[event.eventType]}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {actorHref ? (
              <Link className="font-medium text-blue-700" href={actorHref}>
                {actorName}
              </Link>
            ) : (
              actorName
            )}
            {metadataTitle ? ` - ${metadataTitle}` : null}
          </p>
          {event.steamAppId ? (
            <Link
              className="mt-2 inline-flex text-xs font-medium text-blue-700"
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
