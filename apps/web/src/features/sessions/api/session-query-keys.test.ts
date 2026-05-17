import { describe, expect, it } from 'vitest';

import { sessionQueryKeys } from './session-query-keys';

describe('sessionQueryKeys', () => {
  it('creates stable keys for global, game, and detail queries', () => {
    expect(
      sessionQueryKeys.globalList({ status: 'open', limit: 20, offset: 0 }),
    ).toEqual(['sessions', 'global', { status: 'open', limit: 20, offset: 0 }]);

    expect(
      sessionQueryKeys.gameList(910001, {
        status: 'full',
        limit: 50,
        offset: 10,
      }),
    ).toEqual([
      'sessions',
      'game',
      910001,
      { status: 'full', limit: 50, offset: 10 },
    ]);

    expect(sessionQueryKeys.detail('session-id')).toEqual([
      'sessions',
      'detail',
      'session-id',
    ]);
  });
});
