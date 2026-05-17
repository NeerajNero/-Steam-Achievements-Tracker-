import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DatabaseService } from '../database.service';
import {
  activityEvents,
  appUsers,
  publicProfiles,
  steamProfiles,
  userSteamAccounts,
} from '../schema';

export type ActivityEvent = InferSelectModel<typeof activityEvents>;
export type NewActivityEvent = InferInsertModel<typeof activityEvents>;

export type ActivityEventType =
  | 'profile_synced'
  | 'game_completed'
  | 'rare_achievement_synced'
  | 'guide_published'
  | 'guide_commented'
  | 'guide_voted'
  | 'session_created'
  | 'session_joined'
  | 'session_commented'
  | 'milestone_reached';

export type ActivityVisibility = 'public' | 'private';

export type ActivityEntityType =
  | 'steam_profile'
  | 'game'
  | 'achievement'
  | 'guide'
  | 'guide_comment'
  | 'gaming_session'
  | 'session_comment'
  | 'milestone';

export interface ActivityEventInput {
  actorUserId?: string | null;
  steamProfileId?: string | null;
  eventType: ActivityEventType;
  visibility?: ActivityVisibility;
  entityType: ActivityEntityType;
  entityId?: string | null;
  steamAppId?: number | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface ActivityListFilters {
  eventType?: ActivityEventType;
  steamProfileId?: string;
  steamAppId?: number;
  limit: number;
  offset: number;
}

export interface ActivityActorRow {
  displayName: string | null;
  steamId: string | null;
  avatarUrl: string | null;
  publicSlug: string | null;
}

export interface ActivitySteamProfileRow {
  steamId: string | null;
  personaName: string | null;
  avatarUrl: string | null;
}

export interface ActivityEventWithPublicData {
  event: ActivityEvent;
  actor: ActivityActorRow | null;
  steamProfile: ActivitySteamProfileRow | null;
}

const actorSteamProfiles = alias(steamProfiles, 'actor_steam_profiles');
const eventSteamProfiles = alias(steamProfiles, 'event_steam_profiles');

@Injectable()
export class ActivityEventsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: ActivityEventInput): Promise<ActivityEvent> {
    const rows = await this.databaseService.db
      .insert(activityEvents)
      .values({
        actorUserId: input.actorUserId ?? null,
        steamProfileId: input.steamProfileId ?? null,
        eventType: input.eventType,
        visibility: input.visibility ?? 'public',
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        steamAppId: input.steamAppId ?? null,
        metadata: input.metadata ?? {},
        occurredAt: input.occurredAt,
      })
      .returning();

    return rows[0];
  }

  async findPublic(
    filters: ActivityListFilters,
  ): Promise<ActivityEventWithPublicData[]> {
    return this.selectPublicEvents(filters)
      .orderBy(desc(activityEvents.occurredAt), desc(activityEvents.id))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async countPublic(
    filters: Omit<ActivityListFilters, 'limit' | 'offset'>,
  ): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(activityEvents)
      .where(and(...this.buildPublicConditions(filters)));

    return rows[0]?.total ?? 0;
  }

  private selectPublicEvents(filters: ActivityListFilters) {
    return this.databaseService.db
      .select({
        event: activityEvents,
        actor: {
          displayName: appUsers.displayName,
          steamId: actorSteamProfiles.steamId,
          avatarUrl: sql<string | null>`coalesce(${actorSteamProfiles.avatarUrl}, ${appUsers.avatarUrl})`,
          publicSlug: publicProfiles.slug,
        },
        steamProfile: {
          steamId: eventSteamProfiles.steamId,
          personaName: eventSteamProfiles.personaName,
          avatarUrl: eventSteamProfiles.avatarUrl,
        },
      })
      .from(activityEvents)
      .leftJoin(appUsers, eq(appUsers.id, activityEvents.actorUserId))
      .leftJoin(
        userSteamAccounts,
        and(
          eq(userSteamAccounts.userId, appUsers.id),
          eq(userSteamAccounts.isPrimary, true),
        ),
      )
      .leftJoin(actorSteamProfiles, eq(actorSteamProfiles.id, userSteamAccounts.steamProfileId))
      .leftJoin(
        publicProfiles,
        and(
          eq(publicProfiles.userId, appUsers.id),
          eq(publicProfiles.steamProfileId, userSteamAccounts.steamProfileId),
          eq(publicProfiles.isPublic, true),
        ),
      )
      .leftJoin(eventSteamProfiles, eq(eventSteamProfiles.id, activityEvents.steamProfileId))
      .where(and(...this.buildPublicConditions(filters)));
  }

  private buildPublicConditions(
    filters: Omit<ActivityListFilters, 'limit' | 'offset'>,
  ): SQL[] {
    const conditions: SQL[] = [eq(activityEvents.visibility, 'public')];

    if (filters.eventType !== undefined) {
      conditions.push(eq(activityEvents.eventType, filters.eventType));
    }

    if (filters.steamProfileId !== undefined) {
      conditions.push(eq(activityEvents.steamProfileId, filters.steamProfileId));
    }

    if (filters.steamAppId !== undefined) {
      conditions.push(eq(activityEvents.steamAppId, filters.steamAppId));
    }

    return conditions;
  }
}
