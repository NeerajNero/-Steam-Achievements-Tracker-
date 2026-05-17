import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthSessionsDataService } from '../../db/services/auth-sessions-data.service';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let rowsByHash: Map<string, AuthSessionRow>;
  let authSessionsDataService: {
    create: ReturnType<typeof vi.fn>;
    findByHash: ReturnType<typeof vi.fn>;
    revokeByHash: ReturnType<typeof vi.fn>;
  };
  let service: SessionService;

  beforeEach(() => {
    rowsByHash = new Map<string, AuthSessionRow>();
    authSessionsDataService = {
      create: vi.fn(async (input: CreateSessionInput) => {
        const row = createSessionRow(input);
        rowsByHash.set(input.sessionTokenHash, row);
        return row;
      }),
      findByHash: vi.fn(async (hash: string) => rowsByHash.get(hash) ?? null),
      revokeByHash: vi.fn(async (hash: string) => {
        const existing = rowsByHash.get(hash);
        if (existing !== undefined) {
          rowsByHash.set(hash, { ...existing, revokedAt: new Date() });
        }
      }),
    };
    service = new SessionService(
      authSessionsDataService as unknown as AuthSessionsDataService,
    );
  });

  it('stores a hash instead of the raw session token', async () => {
    const session = await service.createSession('user-id', {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    });

    expect(authSessionsDataService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      }),
    );
    const input = authSessionsDataService.create.mock.calls[0][0] as CreateSessionInput;
    expect(input.sessionTokenHash).toHaveLength(64);
    expect(input.sessionTokenHash).not.toBe(session.token);
    await expect(service.findSessionByToken(session.token)).resolves.toEqual({
      userId: 'user-id',
    });
  });

  it('rejects expired and revoked sessions', async () => {
    const expiredToken = 'expired-token';
    const expiredHash = service.hashSessionToken(expiredToken);
    rowsByHash.set(
      expiredHash,
      createSessionRow({
        userId: 'user-id',
        sessionTokenHash: expiredHash,
        expiresAt: new Date('2000-01-01T00:00:00.000Z'),
      }),
    );

    const revoked = await service.createSession('user-id');
    await service.revokeSessionByToken(revoked.token);

    await expect(service.findSessionByToken(expiredToken)).resolves.toBeNull();
    await expect(service.findSessionByToken(revoked.token)).resolves.toBeNull();
  });
});

interface CreateSessionInput {
  userId: string;
  sessionTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
}

interface AuthSessionRow {
  id: string;
  userId: string;
  sessionTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function createSessionRow(input: CreateSessionInput): AuthSessionRow {
  return {
    id: 'session-id',
    userId: input.userId,
    sessionTokenHash: input.sessionTokenHash,
    userAgent: input.userAgent ?? null,
    ipAddress: input.ipAddress ?? null,
    expiresAt: input.expiresAt,
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
