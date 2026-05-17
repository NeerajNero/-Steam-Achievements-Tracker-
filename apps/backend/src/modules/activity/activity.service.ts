import { Injectable, NotFoundException } from '@nestjs/common';

import {
  ActivityEventsDataService,
  type ActivityEventInput,
  type ActivityEventWithPublicData,
} from '../../db/services/activity-events-data.service';
import { GamesDataService } from '../../db/services/games-data.service';
import { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import type {
  ActivityFeedResponseDto,
  ActivityEventResponseDto,
} from './dto/activity-response.dto';
import type { ActivityQueryDto, GameActivityQueryDto } from './dto/activity-query.dto';

@Injectable()
export class ActivityService {
  constructor(
    private readonly activityEventsDataService: ActivityEventsDataService,
    private readonly steamProfilesDataService: SteamProfilesDataService,
    private readonly gamesDataService: GamesDataService,
  ) {}

  async record(input: ActivityEventInput): Promise<void> {
    await this.activityEventsDataService.create({
      ...input,
      metadata: sanitizeMetadata(input.metadata ?? {}),
    });
  }

  async listActivity(query: ActivityQueryDto): Promise<ActivityFeedResponseDto> {
    const filters = {
      eventType: query.eventType,
      limit: query.limit,
      offset: query.offset,
    };
    const [items, total] = await Promise.all([
      this.activityEventsDataService.findPublic(filters),
      this.activityEventsDataService.countPublic(filters),
    ]);

    return {
      items: items.map(mapActivityEvent),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async listProfileActivity(
    steamId: string,
    query: GameActivityQueryDto,
  ): Promise<ActivityFeedResponseDto> {
    const profile = await this.steamProfilesDataService.findBySteamId(steamId);

    if (profile === null) {
      throw new NotFoundException(`Steam profile ${steamId} was not found`);
    }

    const filters = {
      steamProfileId: profile.id,
      limit: query.limit,
      offset: query.offset,
    };
    const [items, total] = await Promise.all([
      this.activityEventsDataService.findPublic(filters),
      this.activityEventsDataService.countPublic(filters),
    ]);

    return {
      items: items.map(mapActivityEvent),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async listGameActivity(
    steamAppId: number,
    query: GameActivityQueryDto,
  ): Promise<ActivityFeedResponseDto> {
    const game = await this.gamesDataService.findBySteamAppId(steamAppId);

    if (game === null) {
      throw new NotFoundException(`Steam game ${steamAppId} was not found`);
    }

    const filters = {
      steamAppId,
      limit: query.limit,
      offset: query.offset,
    };
    const [items, total] = await Promise.all([
      this.activityEventsDataService.findPublic(filters),
      this.activityEventsDataService.countPublic(filters),
    ]);

    return {
      items: items.map(mapActivityEvent),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }
}

function mapActivityEvent(
  row: ActivityEventWithPublicData,
): ActivityEventResponseDto {
  const steamProfile =
    row.event.steamProfileId === null ||
    row.steamProfile === null ||
    row.steamProfile.steamId === null
      ? null
      : {
          steamId: row.steamProfile.steamId,
          personaName: row.steamProfile.personaName,
          avatarUrl: row.steamProfile.avatarUrl,
        };

  return {
    id: row.event.id,
    eventType: row.event.eventType,
    occurredAt: row.event.occurredAt.toISOString(),
    actor:
      row.event.actorUserId === null
        ? null
        : {
            displayName: row.actor?.displayName ?? null,
            steamId: row.actor?.steamId ?? null,
            avatarUrl: row.actor?.avatarUrl ?? null,
            publicSlug: row.actor?.publicSlug ?? null,
          },
    steamProfile,
    steamAppId: row.event.steamAppId,
    entityType: row.event.entityType,
    entityId: row.event.entityId,
    metadata: row.event.metadata,
  };
}

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => isSafeMetadataValue(value)),
  );
}

function isSafeMetadataValue(value: unknown): boolean {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isSafeMetadataValue);
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(
      isSafeMetadataValue,
    );
  }

  return false;
}
