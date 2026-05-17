import type { Response } from 'express';

import type { Request } from 'express';

import { Injectable } from '@nestjs/common';

import { getAuthConfig } from './auth.config';

export interface AuthStateCookiePayload {
  state: string;
  returnTo: string;
  expiresAt: string;
}

const COOKIE_PAIR_SEPARATOR = ';';

@Injectable()
export class AuthCookieService {
  private readonly config = getAuthConfig();

  setStateCookie(res: Response, payload: AuthStateCookiePayload): void {
    res.cookie(this.config.authStateCookieName, this.serializeStatePayload(payload), {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.authCookieSecure,
      path: '/',
      maxAge: this.config.authStateTtlSeconds * 1000,
    });
  }

  consumeStateCookie(
    req: Request,
  ): AuthStateCookiePayload | null {
    const payload = this.consumeStatePayload(req);

    if (payload === null) {
      return null;
    }

    return isStatePayloadExpired(payload) ? null : payload;
  }

  clearStateCookie(res: Response): void {
    res.clearCookie(this.config.authStateCookieName, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.authCookieSecure,
    });
  }

  setSessionCookie(res: Response, token: string): void {
    res.cookie(this.config.authSessionCookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.authCookieSecure,
      path: '/',
      maxAge: this.config.authSessionTtlDays * 24 * 60 * 60 * 1000,
    });
  }

  clearSessionCookie(res: Response): void {
    res.clearCookie(this.config.authSessionCookieName, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.authCookieSecure,
    });
  }

  getSessionToken(req: Request): string | null {
    const token = this.readCookie(req, this.config.authSessionCookieName);

    if (token === null || token.trim().length === 0) {
      return null;
    }

    return token;
  }

  private serializeStatePayload(payload: AuthStateCookiePayload): string {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  }

  private readStatePayload(raw: string): AuthStateCookiePayload | null {
    try {
      const parsed = JSON.parse(
        Buffer.from(raw, 'base64url').toString('utf8'),
      ) as unknown;

      return AuthStateCookiePayloadSchema.parse(parsed);
    } catch {
      return null;
    }
  }

  private readCookie(req: Request, cookieName: string): string | null {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    const cookies = new Map<string, string>(
      cookieHeader
        .split(COOKIE_PAIR_SEPARATOR)
        .map((part) => part.trim())
        .filter((part) => part.includes('='))
        .map((part) => {
          const index = part.indexOf('=');
          const key = part.slice(0, index);
          const value = part.slice(index + 1);
          return [decodeURIComponent(key), decodeURIComponent(value)] as const;
        }),
    );

    return cookies.get(cookieName) ?? null;
  }

  private consumeStatePayload(req: Request): AuthStateCookiePayload | null {
    const raw = this.readCookie(req, this.config.authStateCookieName);

    if (raw === null) {
      return null;
    }

    return this.readStatePayload(raw);
  }
}

function isStatePayloadExpired(payload: AuthStateCookiePayload): boolean {
  const expiresAt = new Date(payload.expiresAt).getTime();

  return Number.isNaN(expiresAt) || expiresAt < Date.now();
}

namespace AuthStateCookiePayloadSchema {
  export function parse(value: unknown): AuthStateCookiePayload {
    if (
      typeof value !== 'object' ||
      value === null ||
      typeof (value as AuthStateCookiePayload).state !== 'string' ||
      (value as AuthStateCookiePayload).state.trim().length === 0 ||
      typeof (value as AuthStateCookiePayload).returnTo !== 'string' ||
      typeof (value as AuthStateCookiePayload).expiresAt !== 'string' ||
      (value as AuthStateCookiePayload).expiresAt.trim().length === 0
    ) {
      throw new Error('Invalid auth state payload');
    }

    return {
      state: (value as AuthStateCookiePayload).state,
      returnTo: (value as AuthStateCookiePayload).returnTo,
      expiresAt: (value as AuthStateCookiePayload).expiresAt,
    };
  }
}
