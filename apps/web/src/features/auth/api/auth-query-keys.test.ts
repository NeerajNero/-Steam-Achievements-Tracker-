import { describe, expect, it } from 'vitest';

import { authQueryKeys } from './auth-query-keys';

describe('authQueryKeys', () => {
  it('creates stable keys for current user state', () => {
    expect(authQueryKeys.all).toEqual(['auth']);
    expect(authQueryKeys.me()).toEqual(['auth', 'me']);
  });
});
