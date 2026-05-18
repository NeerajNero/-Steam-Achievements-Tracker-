import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';

import { SessionAuthGuard } from '../auth/session-auth.guard';
import { TargetTypeDto } from './dto/target-request.dto';
import { TargetsController } from './targets.controller';
import type { TargetsService } from './targets.service';

describe('TargetsController', () => {
  it('protects account target endpoints with session auth', () => {
    const controller = new TargetsController({} as unknown as TargetsService);

    expect(Reflect.getMetadata(GUARDS_METADATA, TargetsController)).toEqual([
      SessionAuthGuard,
    ]);
    expect(controller).toBeInstanceOf(TargetsController);
  });

  it('delegates list requests to the service', async () => {
    const service = {
      listAccountTargets: vi.fn(async () => ({
        items: [],
        total: 0,
        limit: 50,
        offset: 0,
      })),
    };
    const controller = new TargetsController(
      service as unknown as TargetsService,
    );
    const currentUser = {
      userId: 'user-id',
      user: {
        id: 'user-id',
        displayName: 'Hunter',
        avatarUrl: null,
        role: 'user',
        status: 'active',
      },
      steamAccount: null,
      publicProfile: null,
    };
    const query = { type: TargetTypeDto.All, limit: 50, offset: 0 };

    await expect(controller.listAccountTargets(currentUser, query)).resolves.toEqual({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    });
    expect(service.listAccountTargets).toHaveBeenCalledWith(currentUser, query);
  });
});
