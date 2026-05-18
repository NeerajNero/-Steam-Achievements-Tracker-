import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, inArray, lt, ne, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import {
  achievements,
  appUsers,
  games,
  gamingSessionAchievements,
  gamingSessionParticipants,
  gamingSessions,
  guides,
  profileAchievements,
  profileGames,
  publicProfiles,
  steamProfiles,
  userSteamAccounts,
} from '../schema';
import type { GuideWithAuthor } from './guides.repository';
import type { ProfileGameWithGame } from './profile-games.repository';
import type { SessionSummaryRow } from './gaming-sessions.repository';

export interface DashboardDataQualityCounts {
  metadataOnlyGames: number;
  notSyncedGames: number;
}

export interface DashboardProfileGameRow extends ProfileGameWithGame {}

@Injectable()
export class DashboardRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async countDataQualityGames(
    profileId: string,
  ): Promise<DashboardDataQualityCounts> {
    const rows = await this.databaseService.db
      .select({
        metadataOnlyGames: sql<number>`cast(count(*) filter (
          where ${achievementMetadataCountSql} > 0
            and ${knownUnlockStateCountSql} = 0
        ) as int)`,
        notSyncedGames: sql<number>`cast(count(*) filter (
          where ${achievementMetadataCountSql} = 0
        ) as int)`,
      })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .where(eq(profileGames.profileId, profileId));

    return rows[0] ?? { metadataOnlyGames: 0, notSyncedGames: 0 };
  }

  async findMetadataOnlyGames(
    profileId: string,
    limit: number,
  ): Promise<DashboardProfileGameRow[]> {
    return this.findProfileGamesByAchievementState(profileId, 'metadata_only', limit);
  }

  async findNotSyncedGames(
    profileId: string,
    limit: number,
  ): Promise<DashboardProfileGameRow[]> {
    return this.findProfileGamesByAchievementState(profileId, 'not_synced', limit);
  }

  async findGuideSuggestionsForProfile(
    profileId: string,
    limit: number,
  ): Promise<GuideWithAuthor[]> {
    return this.databaseService.db
      .select({
        guide: guides,
        author: {
          id: appUsers.id,
          displayName: appUsers.displayName,
          avatarUrl: appUsers.avatarUrl,
          role: appUsers.role,
        },
        game: {
          steamAppId: games.steamAppId,
          name: games.name,
          iconUrl: games.iconUrl,
          logoUrl: games.logoUrl,
        },
      })
      .from(guides)
      .innerJoin(appUsers, eq(appUsers.id, guides.authorUserId))
      .innerJoin(games, eq(games.steamAppId, guides.steamAppId))
      .innerJoin(profileGames, eq(profileGames.gameId, games.id))
      .where(
        and(
          eq(profileGames.profileId, profileId),
          eq(guides.status, 'published'),
          eq(guides.visibility, 'public'),
        ),
      )
      .orderBy(desc(guides.publishedAt), desc(guides.updatedAt), asc(guides.title))
      .limit(limit);
  }

  async findHostedSessionsForUser(
    userId: string,
    limit: number,
  ): Promise<SessionSummaryRow[]> {
    return this.findSessionSummaries(
      [eq(gamingSessions.hostUserId, userId)],
      limit,
    );
  }

  async findJoinedSessionsForUser(
    userId: string,
    limit: number,
  ): Promise<SessionSummaryRow[]> {
    return this.findSessionSummaries(
      [
        eq(gamingSessionParticipants.userId, userId),
        eq(gamingSessionParticipants.status, 'joined'),
        ne(gamingSessions.hostUserId, userId),
      ],
      limit,
    );
  }

  async findUpcomingOwnedSessions(
    profileId: string,
    limit: number,
  ): Promise<SessionSummaryRow[]> {
    return this.findSessionSummaries(
      [
        eq(profileGames.profileId, profileId),
        eq(gamingSessions.visibility, 'public'),
        inArray(gamingSessions.status, ['open', 'full']),
        gt(gamingSessions.scheduledStartAt, new Date()),
      ],
      limit,
      true,
    );
  }

  private async findProfileGamesByAchievementState(
    profileId: string,
    state: 'metadata_only' | 'not_synced',
    limit: number,
  ): Promise<DashboardProfileGameRow[]> {
    const stateConditions =
      state === 'metadata_only'
        ? [
            sql`${achievementMetadataCountSql} > 0`,
            sql`${knownUnlockStateCountSql} = 0`,
          ]
        : [sql`${achievementMetadataCountSql} = 0`];

    return this.databaseService.db
      .select({
        profileGame: profileGames,
        game: games,
        achievementMetadataCount: achievementMetadataCountSql,
        knownUnlockStateCount: knownUnlockStateCountSql,
      })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .where(and(eq(profileGames.profileId, profileId), ...stateConditions))
      .orderBy(desc(profileGames.playtimeMinutes), asc(games.name))
      .limit(limit);
  }

  private async findSessionSummaries(
    conditions: SQL[],
    limit: number,
    joinOwnedGames = false,
  ): Promise<SessionSummaryRow[]> {
    const baseQuery = this.databaseService.db
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
      );

    const query = joinOwnedGames
      ? baseQuery.innerJoin(profileGames, eq(profileGames.gameId, games.id))
      : baseQuery;

    return query
      .where(and(...conditions))
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
      .limit(limit);
  }
}

const achievementMetadataCountSql = sql<number>`(
  select cast(count(*) as int)
  from ${achievements}
  where ${achievements.steamAppId} = ${games.steamAppId}
)`;

const knownUnlockStateCountSql = sql<number>`(
  select cast(count(*) as int)
  from ${profileAchievements}
  inner join ${achievements}
    on ${achievements.id} = ${profileAchievements.achievementId}
  where ${profileAchievements.profileId} = ${profileGames.profileId}
    and ${achievements.steamAppId} = ${games.steamAppId}
)`;
