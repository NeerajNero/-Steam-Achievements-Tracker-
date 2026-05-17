import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import {
  AUTH_CALLBACK_REASON_CODES,
  AuthCallbackError,
} from '../../modules/auth/auth-callback-error';
import { DatabaseService } from '../database.service';
import {
  appUsers,
  authSessions,
  publicProfiles,
  steamProfiles,
  userPreferences,
  userSteamAccounts,
} from '../schema';

export interface PersistSteamAuthCallbackInput {
  steamId: string;
  profile: {
    personaName: string | null;
    avatarUrl: string | null;
    profileUrl: string | null;
    visibilityState: number | null;
  };
  session: {
    sessionTokenHash: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    expiresAt: Date;
  };
}

export interface PersistSteamAuthCallbackResult {
  userId: string;
  steamProfileId: string;
  steamId: string;
  personaName: string | null;
  avatarUrl: string | null;
  steamProfileUrl: string | null;
  visibilityState: number | null;
  sessionId: string;
}

@Injectable()
export class AuthCallbackRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async persistSteamLogin(
    input: PersistSteamAuthCallbackInput,
  ): Promise<PersistSteamAuthCallbackResult> {
    return this.databaseService.db.transaction(async (tx) => {
      const [steamProfile] = await tx
        .insert(steamProfiles)
        .values({
          steamId: input.steamId,
          personaName: input.profile.personaName,
          avatarUrl: input.profile.avatarUrl,
          profileUrl: input.profile.profileUrl,
          visibilityState: input.profile.visibilityState,
          isPrivate:
            input.profile.visibilityState === null
              ? undefined
              : input.profile.visibilityState !== 3,
        })
        .onConflictDoUpdate({
          target: steamProfiles.steamId,
          set: {
            personaName: input.profile.personaName,
            avatarUrl: input.profile.avatarUrl,
            profileUrl: input.profile.profileUrl,
            visibilityState: input.profile.visibilityState,
            isPrivate:
              input.profile.visibilityState === null
                ? undefined
                : input.profile.visibilityState !== 3,
            updatedAt: sql`now()`,
          },
        })
        .returning()
        .catch((error: unknown) => {
          throw new AuthCallbackError(
            AUTH_CALLBACK_REASON_CODES.SteamProfileUpsertFailed,
            'Unable to upsert Steam profile for auth callback.',
            { cause: error },
          );
        });

      const [existingAccount] = await tx
        .select()
        .from(userSteamAccounts)
        .where(eq(userSteamAccounts.steamId, input.steamId))
        .limit(1);

      let userId = existingAccount?.userId;

      if (userId === undefined) {
        const [user] = await tx
          .insert(appUsers)
          .values({
            displayName: input.profile.personaName,
            avatarUrl: input.profile.avatarUrl,
          })
          .returning();
        userId = user.id;
      }

      await tx
        .update(userSteamAccounts)
        .set({ isPrimary: false, updatedAt: sql`now()` })
        .where(
          and(
            eq(userSteamAccounts.userId, userId),
            eq(userSteamAccounts.isPrimary, true),
          ),
        );

      if (existingAccount === undefined) {
        await tx
          .insert(userSteamAccounts)
          .values({
            userId,
            steamProfileId: steamProfile.id,
            steamId: input.steamId,
            isPrimary: true,
          })
          .onConflictDoUpdate({
            target: userSteamAccounts.steamId,
            set: {
              userId,
              steamProfileId: steamProfile.id,
              isPrimary: true,
              updatedAt: sql`now()`,
            },
          });
      } else {
        await tx
          .update(userSteamAccounts)
          .set({
            steamProfileId: steamProfile.id,
            isPrimary: true,
            updatedAt: sql`now()`,
          })
          .where(eq(userSteamAccounts.steamId, input.steamId));
      }

      await tx
        .insert(userPreferences)
        .values({ userId })
        .onConflictDoNothing({ target: userPreferences.userId });

      await tx
        .insert(publicProfiles)
        .values({
          userId,
          steamProfileId: steamProfile.id,
        })
        .onConflictDoNothing({ target: publicProfiles.steamProfileId });

      await tx
        .update(appUsers)
        .set({ lastLoginAt: sql`now()`, updatedAt: sql`now()` })
        .where(eq(appUsers.id, userId));

      const [session] = await tx
        .insert(authSessions)
        .values({
          userId,
          sessionTokenHash: input.session.sessionTokenHash,
          userAgent: input.session.userAgent ?? null,
          ipAddress: input.session.ipAddress ?? null,
          expiresAt: input.session.expiresAt,
        })
        .returning({ id: authSessions.id })
        .catch((error: unknown) => {
          throw new AuthCallbackError(
            AUTH_CALLBACK_REASON_CODES.SessionCreateFailed,
            'Unable to create auth session.',
            { cause: error },
          );
        });

      return {
        userId,
        steamProfileId: steamProfile.id,
        steamId: input.steamId,
        personaName: input.profile.personaName,
        avatarUrl: input.profile.avatarUrl,
        steamProfileUrl: input.profile.profileUrl,
        visibilityState: input.profile.visibilityState,
        sessionId: session.id,
      };
    });
  }
}
