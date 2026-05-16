import { describe, expect, it } from 'vitest';

import { profileQueryKeys } from './profile-query-keys';

describe('profileQueryKeys', () => {
  it('creates stable keys for profile-level data', () => {
    expect(profileQueryKeys.detail('765')).toEqual([
      'profiles',
      '765',
      'detail',
    ]);
    expect(profileQueryKeys.summary('765')).toEqual([
      'profiles',
      '765',
      'summary',
    ]);
  });

  it('includes parameters for collection keys', () => {
    expect(
      profileQueryKeys.games('765', {
        limit: 25,
        sort: 'completion',
        order: 'desc',
      }),
    ).toEqual([
      'profiles',
      '765',
      'games',
      { limit: 25, sort: 'completion', order: 'desc' },
    ]);
  });
});
