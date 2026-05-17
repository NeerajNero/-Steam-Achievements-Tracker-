import { describe, expect, it } from 'vitest';

import { activityQueryKeys } from './activity-query-keys';

describe('activityQueryKeys', () => {
  it('creates stable global activity keys', () => {
    expect(activityQueryKeys.global({ limit: 10, offset: 0 })).toEqual([
      'activity',
      'global',
      { limit: 10, offset: 0 },
    ]);
  });

  it('creates stable scoped activity keys', () => {
    expect(activityQueryKeys.profile('76561198000000000', { limit: 5 })).toEqual([
      'activity',
      'profile',
      '76561198000000000',
      { limit: 5 },
    ]);
    expect(activityQueryKeys.game(910001, { offset: 5 })).toEqual([
      'activity',
      'game',
      910001,
      { offset: 5 },
    ]);
  });
});
