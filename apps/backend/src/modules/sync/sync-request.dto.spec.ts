import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { SyncRequestDto, SyncScopeDto } from './dto/sync-request.dto';

describe('SyncRequestDto', () => {
  it('accepts supported sync scopes', () => {
    const profileScope = plainToInstance(SyncRequestDto, {
      scope: SyncScopeDto.Profile,
    });
    const gamesScope = plainToInstance(SyncRequestDto, {
      scope: SyncScopeDto.Games,
    });
    const achievementsScope = plainToInstance(SyncRequestDto, {
      scope: SyncScopeDto.Achievements,
      appIds: [910001, 910002],
    });

    expect(validateSync(profileScope)).toHaveLength(0);
    expect(validateSync(gamesScope)).toHaveLength(0);
    expect(validateSync(achievementsScope)).toHaveLength(0);
  });

  it('rejects invalid sync scopes', () => {
    const body = plainToInstance(SyncRequestDto, { scope: 'full' });

    expect(validateSync(body).map((error) => error.property)).toEqual(['scope']);
  });

  it('rejects invalid achievement app IDs', () => {
    const body = plainToInstance(SyncRequestDto, {
      scope: SyncScopeDto.Achievements,
      appIds: [910001, 0, 1.5],
    });

    expect(validateSync(body).map((error) => error.property)).toEqual(['appIds']);
  });

  it('rejects too many achievement app IDs', () => {
    const body = plainToInstance(SyncRequestDto, {
      scope: SyncScopeDto.Achievements,
      appIds: Array.from({ length: 101 }, (_, index) => index + 1),
    });

    expect(validateSync(body).map((error) => error.property)).toEqual(['appIds']);
  });
});
