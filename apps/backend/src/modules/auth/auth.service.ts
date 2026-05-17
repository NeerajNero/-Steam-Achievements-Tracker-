import { randomBytes } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SteamApiClient } from '../steam/steam-api.client';

import { AppUsersDataService } from '../../db/services/app-users-data.service';
import { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import { UserPreferencesDataService } from '../../db/services/user-preferences-data.service';
import { UserSteamAccountsDataService } from '../../db/services/user-steam-accounts-data.service';
import { getAuthConfig, type AuthConfig } from './auth.config';
import {
  type OpenIdCallbackData,
  SteamOpenIdService,
} from './steam-openid.service';
import { SessionService } from './session.service';

export interface AuthLoginPayload {
  state: string;
  returnTo: string;
  expiresAt: string;
}

export interface AuthSessionInfo {
  userId: string;
  steamProfileId: string;
  steamId: string;
  personaName: string | null;
  avatarUrl: string | null;
  steamProfileUrl: string | null;
  visibilityState: number | null;
}

export interface SessionTokenResult {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface AuthenticatedSessionUser {
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: string;
    status: string;
  };
  steamAccount: {
    steamId: string;
    steamProfileId: string;
    personaName: string | null;
    avatarUrl: string | null;
    isPrimary: boolean;
  } | null;
  publicProfile: {
    slug: string | null;
    isPublic: boolean;
  } | null;
}

@Injectable()
export class AuthService {
  private readonly config = getAuthConfig();

  constructor(
    private readonly appUsersDataService: AppUsersDataService,
    private readonly userSteamAccountsDataService: UserSteamAccountsDataService,
    private readonly userPreferencesDataService: UserPreferencesDataService,
    private readonly publicProfilesDataService: PublicProfilesDataService,
    private readonly steamProfilesDataService: SteamProfilesDataService,
    private readonly steamApiClient: SteamApiClient,
    private readonly sessionService: SessionService,
    private readonly steamOpenIdService: SteamOpenIdService,
  ) {}

  buildLoginStatePayload(returnTo: string): AuthLoginPayload {
    return {
      state: randomHex(32),
      returnTo: this.normalizeReturnTo(returnTo),
      expiresAt: new Date(
        Date.now() + this.config.authStateTtlSeconds * 1000,
      ).toISOString(),
    };
  }

  buildLoginUrl(state: string): string {
    return this.steamOpenIdService.buildLoginUrl(state);
  }

  async handleOpenIdCallback(
    query: OpenIdCallbackData & Record<string, string>,
    statePayload: AuthLoginPayload,
  ): Promise<AuthSessionInfo> {
    const queryRecord: Record<string, string> = {};

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        queryRecord[key] = value;
      }
    }

    const callbackState = this.steamOpenIdService.getCallbackState(queryRecord);

    if (callbackState === undefined || callbackState !== statePayload.state) {
      throw new UnauthorizedException('Steam callback state is invalid.');
    }

    const verified = await this.steamOpenIdService.verifyCallback(queryRecord);
    const profile = await this.claimProfile(verified.steamId);

    const steamProfileId = await this.resolveSteamProfile(verified.steamId, profile);
    let account = await this.userSteamAccountsDataService.findBySteamId(
      verified.steamId,
    );

    if (account === null) {
      const user = await this.appUsersDataService.create({
        displayName: profile.personaName,
        avatarUrl: profile.avatarUrl,
      });
      account = await this.userSteamAccountsDataService.createOrRefreshPrimaryAccount({
        userId: user.id,
        steamProfileId,
        steamId: verified.steamId,
      });

      await this.ensureUserPreferences(user.id);
      await this.ensurePublicProfile(user.id, steamProfileId);
      await this.appUsersDataService.touchLastLogin(user.id);

      return {
        userId: user.id,
        steamProfileId,
        steamId: verified.steamId,
        personaName: profile.personaName,
        avatarUrl: profile.avatarUrl,
        steamProfileUrl: profile.profileUrl,
        visibilityState: profile.visibilityState,
      };
    }

    await this.userSteamAccountsDataService.setPrimary(account.userId, steamProfileId);
    await this.ensureUserPreferences(account.userId);
    await this.ensurePublicProfile(account.userId, steamProfileId);
    await this.appUsersDataService.touchLastLogin(account.userId);

    return {
      userId: account.userId,
      steamProfileId,
      steamId: verified.steamId,
      personaName: profile.personaName,
      avatarUrl: profile.avatarUrl,
      steamProfileUrl: profile.profileUrl,
      visibilityState: profile.visibilityState,
    };
  }

  async createSessionForUser(
    userId: string,
    req?: {
      ip?: string;
      headers?: {
        'user-agent'?: string | string[] | undefined;
      };
    },
  ): Promise<SessionTokenResult> {
    const userAgentValue =
      req?.headers?.['user-agent'] === undefined
        ? undefined
        : Array.isArray(req.headers['user-agent'])
          ? req.headers['user-agent'][0]
          : req.headers['user-agent'];

    return this.sessionService.createSession(userId, {
      ip: req?.ip,
      headers: userAgentValue === undefined ? {} : { 'user-agent': userAgentValue },
    });
  }

  async revokeSession(token: string): Promise<void> {
    await this.sessionService.revokeSessionByToken(token);
  }

  getAuthCookieConfig(): AuthConfig {
    return this.config;
  }

  async getCurrentUser(sessionToken: string): Promise<AuthenticatedSessionUser | null> {
    const session = await this.sessionService.findSessionByToken(sessionToken);
    if (session === null) {
      return null;
    }

    const user = await this.appUsersDataService.findById(session.userId);
    if (user === null) {
      return null;
    }

    const primaryAccount =
      await this.userSteamAccountsDataService.findPrimaryByUserId(user.id);

    if (primaryAccount === null) {
      return {
        user: {
          id: user.id,
          displayName: user.displayName ?? null,
          avatarUrl: user.avatarUrl ?? null,
          role: user.role,
          status: user.status,
        },
        steamAccount: null,
        publicProfile: null,
      };
    }

    const steamProfile = await this.steamProfilesDataService.findById(
      primaryAccount.steamProfileId,
    );
    const publicProfile = await this.publicProfilesDataService.findByUserAndProfileId(
      user.id,
      primaryAccount.steamProfileId,
    );

    return {
      user: {
        id: user.id,
        displayName: user.displayName ?? null,
        avatarUrl: user.avatarUrl ?? null,
        role: user.role,
        status: user.status,
      },
      steamAccount: {
        steamId: primaryAccount.steamId,
        steamProfileId: primaryAccount.steamProfileId,
        personaName: steamProfile?.personaName ?? null,
        avatarUrl: steamProfile?.avatarUrl ?? null,
        isPrimary: primaryAccount.isPrimary,
      },
      publicProfile: {
        slug: publicProfile?.slug ?? null,
        isPublic: publicProfile?.isPublic ?? true,
      },
    };
  }

  normalizeReturnTo(returnTo: string): string {
    return normalizeReturnTo(returnTo, this.config);
  }

  parseReturnTo(raw: string | undefined): string {
    return this.normalizeReturnTo(raw ?? '/');
  }

  async validateAndCreateAccount(profileId: string): Promise<{ userId: string }> {
    const existing = await this.userSteamAccountsDataService.findBySteamId(profileId);

    if (existing === null) {
      throw new UnauthorizedException('Profile has no linked account.');
    }

    return { userId: existing.userId };
  }

  async isSessionExpired(token: string): Promise<boolean> {
    const session = await this.sessionService.findSessionByToken(token);
    return session === null;
  }

  private async ensureUserPreferences(userId: string): Promise<void> {
    const existing = await this.userPreferencesDataService.findByUserId(userId);

    if (existing === null) {
      await this.userPreferencesDataService.create(userId);
    }
  }

  private async ensurePublicProfile(
    userId: string,
    steamProfileId: string,
  ): Promise<void> {
    const existing = await this.publicProfilesDataService.findByUserAndProfileId(
      userId,
      steamProfileId,
    );

    if (existing === null) {
      await this.publicProfilesDataService.create({
        userId,
        steamProfileId,
      });
    }
  }

  private async resolveSteamProfile(
    steamId: string,
    fallbackSummary: {
      personaName: string | null;
      avatarUrl: string | null;
      profileUrl: string | null;
      visibilityState: number | null;
    },
  ): Promise<string> {
    const profile = await this.steamProfilesDataService.upsertProfile({
      steamId,
      personaName: fallbackSummary.personaName,
      avatarUrl: fallbackSummary.avatarUrl,
      profileUrl: fallbackSummary.profileUrl,
      visibilityState: fallbackSummary.visibilityState,
    });

    return profile.id;
  }

  private async claimProfile(steamId: string): Promise<{
    personaName: string | null;
    avatarUrl: string | null;
    profileUrl: string | null;
    visibilityState: number | null;
  }> {
    const [summary] = await this.steamApiClient
      .getPlayerSummaries([steamId])
      .catch(() => []);

    if (summary === undefined) {
      return {
        personaName: null,
        avatarUrl: null,
        profileUrl: null,
        visibilityState: null,
      };
    }

    return {
      personaName: summary.personaName,
      avatarUrl: summary.avatarUrl,
      profileUrl: summary.profileUrl,
      visibilityState: summary.visibilityState,
    };
  }
}

function randomHex(length: number): string {
  return randomBytes(length).toString('base64url');
}

function normalizeReturnTo(rawReturnTo: string, config: AuthConfig): string {
  if (rawReturnTo.startsWith('/')) {
    return rawReturnTo.startsWith('//') ? '/' : rawReturnTo;
  }

  try {
    const candidate = new URL(rawReturnTo);
    const frontendOrigin = new URL(config.frontendPublicUrl);

    if (candidate.origin === frontendOrigin.origin) {
      return `${candidate.pathname}${candidate.search}${candidate.hash}`;
    }

    return '/';
  } catch {
    return '/';
  }
}
