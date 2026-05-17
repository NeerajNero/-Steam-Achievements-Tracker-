import { describe, expect, it } from 'vitest';

import { badgeQueryKeys } from './badge-query-keys';

describe('badgeQueryKeys', () => {
  it('creates stable keys', () => {
    expect(badgeQueryKeys.definitions()).toEqual(['badges', 'definitions']);
    expect(badgeQueryKeys.profile('76561198000000000')).toEqual([
      'badges',
      'profile',
      '76561198000000000',
    ]);
  });
});
