import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import type { Request } from 'express';
import { getAuthConfig } from './auth.config';
import { AuthSessionsDataService } from '../../db/services/auth-sessions-data.service';

export interface CreatedSession {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface PreparedSession {
  token: string;
  sessionTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  private readonly config = getAuthConfig();

  constructor(private readonly authSessionsDataService: AuthSessionsDataService) {}

  async createSession(
    userId: string,
    req?: Pick<Request, 'ip' | 'headers'>,
  ): Promise<CreatedSession> {
    const prepared = this.prepareSession(req);

    await this.authSessionsDataService.create({
      userId,
      sessionTokenHash: prepared.sessionTokenHash,
      userAgent: prepared.userAgent,
      ipAddress: prepared.ipAddress,
      expiresAt: prepared.expiresAt,
    });

    return {
      token: prepared.token,
      userId,
      expiresAt: prepared.expiresAt,
    };
  }

  prepareSession(req?: Pick<Request, 'ip' | 'headers'>): PreparedSession {
    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.config.authSessionTtlDays * 24 * 60 * 60 * 1000,
    );

    return {
      token,
      sessionTokenHash: this.hashSessionToken(token),
      userAgent:
        typeof req?.headers['user-agent'] === 'string'
          ? req.headers['user-agent']
          : null,
      ipAddress: normalizeIp(req?.ip),
      expiresAt,
    };
  }

  async revokeSessionByToken(token: string): Promise<void> {
    const sessionTokenHash = this.hashSessionToken(token);
    await this.authSessionsDataService.revokeByHash(sessionTokenHash);
  }

  hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async findSessionByToken(
    token: string,
  ): Promise<{ userId: string } | null> {
    const row = await this.authSessionsDataService.findByHash(
      this.hashSessionToken(token),
    );

    if (row === null || row.revokedAt !== null || row.expiresAt < new Date()) {
      return null;
    }

    return { userId: row.userId };
  }
}

function normalizeIp(ip?: string): string | null {
  if (typeof ip !== 'string') {
    return null;
  }

  const trimmed = ip.trim();
  return trimmed.length === 0 ? null : trimmed;
}
