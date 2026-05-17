import { describe, expect, it } from 'vitest';

import { showcaseQueryKeys } from './showcase-query-keys';

describe('showcaseQueryKeys', () => {
  it('creates stable keys', () => {
    expect(showcaseQueryKeys.account()).toEqual(['showcase', 'account']);
    expect(showcaseQueryKeys.profile('76561198000000000')).toEqual([
      'showcase',
      'profile',
      '76561198000000000',
    ]);
  });
});
