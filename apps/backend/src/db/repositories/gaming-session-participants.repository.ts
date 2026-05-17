import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import {
  appUsers,
  gamingSessionParticipants,
  publicProfiles,
  steamProfiles,
  userSteamAccounts,
} from '../schema';

export type GamingSessionParticipant = InferSelectModel<
  typeof gamingSessionParticipants
>;
export type NewGamingSessionParticipant = InferInsertModel<
  typeof gamingSessionParticipants
>;

export interface ParticipantWithUser {
  participant: GamingSessionParticipant;
  user: {
    displayName: string | null;
    avatarUrl: string | null;
  };
  steamAccount: {
    steamId: string | null;
    avatarUrl: string | null;
    publicSlug: string | null;
  };
}

@Injectable()
export class GamingSessionParticipantsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findBySessionId(sessionId: string): Promise<ParticipantWithUser[]> {
    return this.databaseService.db
      .select({
        participant: gamingSessionParticipants,
        user: {
          displayName: appUsers.displayName,
          avatarUrl: appUsers.avatarUrl,
        },
        steamAccount: {
          steamId: steamProfiles.steamId,
          avatarUrl: steamProfiles.avatarUrl,
          publicSlug: publicProfiles.slug,
        },
      })
      .from(gamingSessionParticipants)
      .innerJoin(appUsers, eq(appUsers.id, gamingSessionParticipants.userId))
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
      .where(eq(gamingSessionParticipants.sessionId, sessionId));
  }

  async findBySessionAndUser(
    sessionId: string,
    userId: string,
  ): Promise<GamingSessionParticipant | null> {
    const rows = await this.databaseService.db
      .select()
      .from(gamingSessionParticipants)
      .where(
        and(
          eq(gamingSessionParticipants.sessionId, sessionId),
          eq(gamingSessionParticipants.userId, userId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async join(
    sessionId: string,
    userId: string,
  ): Promise<GamingSessionParticipant> {
    const existing = await this.findBySessionAndUser(sessionId, userId);

    if (existing !== null) {
      const rows = await this.databaseService.db
        .update(gamingSessionParticipants)
        .set({
          status: 'joined',
          leftAt: null,
          updatedAt: sql`now()`,
        })
        .where(eq(gamingSessionParticipants.id, existing.id))
        .returning();

      return rows[0];
    }

    const rows = await this.databaseService.db
      .insert(gamingSessionParticipants)
      .values({
        sessionId,
        userId,
        role: 'participant',
        status: 'joined',
      })
      .returning();

    return rows[0];
  }

  async leave(sessionId: string, userId: string): Promise<boolean> {
    const rows = await this.databaseService.db
      .update(gamingSessionParticipants)
      .set({
        status: 'left',
        leftAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(gamingSessionParticipants.sessionId, sessionId),
          eq(gamingSessionParticipants.userId, userId),
          eq(gamingSessionParticipants.status, 'joined'),
        ),
      )
      .returning({ id: gamingSessionParticipants.id });

    return rows.length > 0;
  }
}
