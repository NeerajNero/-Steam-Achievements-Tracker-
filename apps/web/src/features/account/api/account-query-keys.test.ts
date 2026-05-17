import { describe, expect, it } from 'vitest';

import { accountQueryKeys } from './account-query-keys';

describe('accountQueryKeys', () => {
  it('creates stable account query keys', () => {
    expect(accountQueryKeys.all).toEqual(['account']);
    expect(accountQueryKeys.me()).toEqual(['account', 'me']);
    expect(accountQueryKeys.preferences()).toEqual(['account', 'preferences']);
    expect(accountQueryKeys.publicProfile()).toEqual([
      'account',
      'public-profile',
    ]);
  });
});
