import { randomBytes } from 'node:crypto';

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { SteamApiClient } from '../steam/steam-api.client';

import { AuthCallbackDataService } from '../../db/services/auth-callback-data.service';
import { AppUsersDataService } from '../../db/services/app-users-data.service';
import { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import { UserSteamAccountsDataService } from '../../db/services/user-steam-accounts-data.service';
import { getAuthConfig, type AuthConfig } from './auth.config';
import {
  AUTH_CALLBACK_REASON_CODES,
  AuthCallbackError,
} from './auth-callback-error';
import {
  type OpenIdCallbackData,
  hasRequiredOpenIdFields,
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

export interface AuthCallbackSessionResult extends AuthSessionInfo {
  session: SessionTokenResult;
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
  private readonly logger = new Logger(AuthService.name);
  private readonly config = getAuthConfig();

  constructor(
    private readonly authCallbackDataService: AuthCallbackDataService,
    private readonly appUsersDataService: AppUsersDataService,
    private readonly userSteamAccountsDataService: UserSteamAccountsDataService,
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
    const result = await this.handleOpenIdCallbackAndCreateSession(
      query,
      statePayload,
    );

    return {
      userId: result.userId,
      steamProfileId: result.steamProfileId,
      steamId: result.steamId,
      personaName: result.personaName,
      avatarUrl: result.avatarUrl,
      steamProfileUrl: result.steamProfileUrl,
      visibilityState: result.visibilityState,
    };
  }

  async handleOpenIdCallbackAndCreateSession(
    query: OpenIdCallbackData & Record<string, string>,
    statePayload: AuthLoginPayload,
    req?: {
      ip?: string;
      headers?: {
        'user-agent'?: string | string[] | undefined;
      };
    },
  ): Promise<AuthCallbackSessionResult> {
    const queryRecord: Record<string, string> = {};

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        queryRecord[key] = value;
      }
    }

    const callbackState = this.steamOpenIdService.getCallbackState(queryRecord);

    if (callbackState === undefined || callbackState !== statePayload.state) {
      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.AuthStateInvalid,
        'Steam callback state is invalid.',
      );
    }

    this.logger.log('event=state_verified');
    this.logger.log(
      `event=openid_fields_present required=${hasRequiredOpenIdFields(queryRecord)}`,
    );
    const verified = await this.steamOpenIdService.verifyCallback(queryRecord);
    this.logger.log('event=openid_verified');
    this.logger.log(`event=steam_id_extracted steamId=${verified.steamId}`);
    const profile = await this.claimProfile(verified.steamId);
    const userAgentValue =
      req?.headers?.['user-agent'] === undefined
        ? undefined
        : Array.isArray(req.headers['user-agent'])
          ? req.headers['user-agent'][0]
          : req.headers['user-agent'];
    const preparedSession = this.sessionService.prepareSession({
      ip: req?.ip,
      headers: userAgentValue === undefined ? {} : { 'user-agent': userAgentValue },
    });

    try {
      const persisted = await this.authCallbackDataService.persistSteamLogin({
        steamId: verified.steamId,
        profile,
        session: {
          sessionTokenHash: preparedSession.sessionTokenHash,
          userAgent: preparedSession.userAgent,
          ipAddress: preparedSession.ipAddress,
          expiresAt: preparedSession.expiresAt,
        },
      });

      this.logger.log(
        `event=profile_claimed steamId=${verified.steamId} steamProfileId=${persisted.steamProfileId}`,
      );

      return {
        userId: persisted.userId,
        steamProfileId: persisted.steamProfileId,
        steamId: persisted.steamId,
        personaName: persisted.personaName,
        avatarUrl: persisted.avatarUrl,
        steamProfileUrl: persisted.steamProfileUrl,
        visibilityState: persisted.visibilityState,
        session: {
          token: preparedSession.token,
          userId: persisted.userId,
          expiresAt: preparedSession.expiresAt,
        },
      };
    } catch (error: unknown) {
      if (error instanceof AuthCallbackError) {
        throw error;
      }

      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.AppUserLinkFailed,
        'Unable to persist Steam auth callback state.',
        { cause: error },
      );
    }
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
