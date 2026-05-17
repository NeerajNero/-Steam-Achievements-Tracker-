import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import {
  appUsers,
  games,
  gamingSessionAchievements,
  gamingSessionParticipants,
  gamingSessions,
  publicProfiles,
  steamProfiles,
  userSteamAccounts,
} from '../schema';

export type GamingSession = InferSelectModel<typeof gamingSessions>;
export type NewGamingSession = InferInsertModel<typeof gamingSessions>;
export type GamingSessionStatus = 'open' | 'full' | 'completed' | 'cancelled';
export type GamingSessionVisibility = 'public' | 'unlisted' | 'private';

export interface SessionListFilters {
  steamAppId?: number;
  status?: GamingSessionStatus;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

export interface CreateGamingSessionInput {
  steamAppId: number;
  hostUserId: string;
  title: string;
  description?: string | null;
  scheduledStartAt: Date;
  scheduledEndAt?: Date | null;
  timezone?: string | null;
  maxParticipants: number;
  visibility: GamingSessionVisibility;
  externalVoiceUrl?: string | null;
}

export type UpdateGamingSessionInput = Partial<
  Pick<
    NewGamingSession,
    | 'title'
    | 'description'
    | 'scheduledStartAt'
    | 'scheduledEndAt'
    | 'timezone'
    | 'maxParticipants'
    | 'visibility'
    | 'externalVoiceUrl'
    | 'status'
  >
>;

export interface SessionHostRow {
  displayName: string | null;
  steamId: string | null;
  avatarUrl: string | null;
  publicSlug: string | null;
}

export interface SessionSummaryRow {
  session: GamingSession;
  game: {
    steamAppId: number;
    name: string;
    iconUrl: string | null;
    logoUrl: string | null;
  };
  host: SessionHostRow;
  participantCount: number;
  achievementCount: number;
}

@Injectable()
export class GamingSessionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createWithHost(input: CreateGamingSessionInput): Promise<GamingSession> {
    return this.databaseService.db.transaction(async (tx) => {
      const [session] = await tx
        .insert(gamingSessions)
        .values({
          steamAppId: input.steamAppId,
          hostUserId: input.hostUserId,
          title: input.title,
          description: input.description,
          scheduledStartAt: input.scheduledStartAt,
          scheduledEndAt: input.scheduledEndAt,
          timezone: input.timezone,
          maxParticipants: input.maxParticipants,
          visibility: input.visibility,
          externalVoiceUrl: input.externalVoiceUrl,
        })
        .returning();

      await tx.insert(gamingSessionParticipants).values({
        sessionId: session.id,
        userId: input.hostUserId,
        role: 'host',
        status: 'joined',
      });

      return session;
    });
  }

  async update(
    id: string,
    input: UpdateGamingSessionInput,
  ): Promise<GamingSession | null> {
    const rows = await this.databaseService.db
      .update(gamingSessions)
      .set({ ...input, updatedAt: sql`now()` })
      .where(eq(gamingSessions.id, id))
      .returning();

    return rows[0] ?? null;
  }

  async findById(id: string): Promise<GamingSession | null> {
    const rows = await this.databaseService.db
      .select()
      .from(gamingSessions)
      .where(eq(gamingSessions.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findSummaries(filters: SessionListFilters): Promise<SessionSummaryRow[]> {
    return this.databaseService.db
      .select({
        session: gamingSessions,
        game: {
          steamAppId: games.steamAppId,
          name: games.name,
          iconUrl: games.iconUrl,
          logoUrl: games.logoUrl,
        },
        host: {
          displayName: appUsers.displayName,
          steamId: steamProfiles.steamId,
          avatarUrl: sql<string | null>`coalesce(${steamProfiles.avatarUrl}, ${appUsers.avatarUrl})`,
          publicSlug: publicProfiles.slug,
        },
        participantCount: sql<number>`cast(count(distinct ${gamingSessionParticipants.id}) filter (where ${gamingSessionParticipants.status} = 'joined') as int)`,
        achievementCount: sql<number>`cast(count(distinct ${gamingSessionAchievements.id}) as int)`,
      })
      .from(gamingSessions)
      .innerJoin(games, eq(games.steamAppId, gamingSessions.steamAppId))
      .innerJoin(appUsers, eq(appUsers.id, gamingSessions.hostUserId))
      .leftJoin(
        userSteamAccounts,
        and(
          eq(userSteamAccounts.userId, appUsers.id),
          eq(userSteamAccounts.isPrimary, true),
        ),
      )
      .leftJoin(steamProfiles, eq(steamProfiles.id, userSteamAccounts.steamProfileId))
      .leftJoin(
        publicProfiles,
        and(
          eq(publicProfiles.userId, appUsers.id),
          eq(publicProfiles.steamProfileId, userSteamAccounts.steamProfileId),
          eq(publicProfiles.isPublic, true),
        ),
      )
      .leftJoin(
        gamingSessionParticipants,
        eq(gamingSessionParticipants.sessionId, gamingSessions.id),
      )
      .leftJoin(
        gamingSessionAchievements,
        eq(gamingSessionAchievements.sessionId, gamingSessions.id),
      )
      .where(and(...this.buildPublicConditions(filters)))
      .groupBy(
        gamingSessions.id,
        games.steamAppId,
        games.name,
        games.iconUrl,
        games.logoUrl,
        appUsers.displayName,
        appUsers.avatarUrl,
        steamProfiles.steamId,
        steamProfiles.avatarUrl,
        publicProfiles.slug,
      )
      .orderBy(asc(gamingSessions.scheduledStartAt), asc(gamingSessions.title))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async countSummaries(
    filters: Omit<SessionListFilters, 'limit' | 'offset'>,
  ): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: count() })
      .from(gamingSessions)
      .where(and(...this.buildPublicConditions(filters)));

    return rows[0]?.total ?? 0;
  }

  async findSummaryById(id: string): Promise<SessionSummaryRow | null> {
    const rows = await this.databaseService.db
      .select({
        session: gamingSessions,
        game: {
          steamAppId: games.steamAppId,
          name: games.name,
          iconUrl: games.iconUrl,
          logoUrl: games.logoUrl,
        },
        host: {
          displayName: appUsers.displayName,
          steamId: steamProfiles.steamId,
          avatarUrl: sql<string | null>`coalesce(${steamProfiles.avatarUrl}, ${appUsers.avatarUrl})`,
          publicSlug: publicProfiles.slug,
        },
        participantCount: sql<number>`cast(count(distinct ${gamingSessionParticipants.id}) filter (where ${gamingSessionParticipants.status} = 'joined') as int)`,
        achievementCount: sql<number>`cast(count(distinct ${gamingSessionAchievements.id}) as int)`,
      })
      .from(gamingSessions)
      .innerJoin(games, eq(games.steamAppId, gamingSessions.steamAppId))
      .innerJoin(appUsers, eq(appUsers.id, gamingSessions.hostUserId))
      .leftJoin(
        userSteamAccounts,
        and(
          eq(userSteamAccounts.userId, appUsers.id),
          eq(userSteamAccounts.isPrimary, true),
        ),
      )
      .leftJoin(steamProfiles, eq(steamProfiles.id, userSteamAccounts.steamProfileId))
      .leftJoin(
        publicProfiles,
        and(
          eq(publicProfiles.userId, appUsers.id),
          eq(publicProfiles.steamProfileId, userSteamAccounts.steamProfileId),
          eq(publicProfiles.isPublic, true),
        ),
      )
      .leftJoin(
        gamingSessionParticipants,
        eq(gamingSessionParticipants.sessionId, gamingSessions.id),
      )
      .leftJoin(
        gamingSessionAchievements,
        eq(gamingSessionAchievements.sessionId, gamingSessions.id),
      )
      .where(eq(gamingSessions.id, id))
      .groupBy(
        gamingSessions.id,
        games.steamAppId,
        games.name,
        games.iconUrl,
        games.logoUrl,
        appUsers.displayName,
        appUsers.avatarUrl,
        steamProfiles.steamId,
        steamProfiles.avatarUrl,
        publicProfiles.slug,
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async canViewPrivateSession(id: string, userId: string): Promise<boolean> {
    const rows = await this.databaseService.db
      .select({ id: gamingSessionParticipants.id })
      .from(gamingSessionParticipants)
      .where(
        and(
          eq(gamingSessionParticipants.sessionId, id),
          eq(gamingSessionParticipants.userId, userId),
          eq(gamingSessionParticipants.status, 'joined'),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  private buildPublicConditions(
    filters: Omit<SessionListFilters, 'limit' | 'offset'>,
  ): SQL[] {
    const conditions: SQL[] = [eq(gamingSessions.visibility, 'public')];

    if (filters.status !== undefined) {
      conditions.push(eq(gamingSessions.status, filters.status));
    }

    if (filters.steamAppId !== undefined) {
      conditions.push(eq(gamingSessions.steamAppId, filters.steamAppId));
    }

    if (filters.from !== undefined) {
      conditions.push(gte(gamingSessions.scheduledStartAt, filters.from));
    }

    if (filters.to !== undefined) {
      conditions.push(lte(gamingSessions.scheduledStartAt, filters.to));
    }

    return conditions;
  }
}
