import { describe, expect, it } from 'vitest';

import { milestoneQueryKeys } from './milestone-query-keys';

describe('milestoneQueryKeys', () => {
  it('creates stable profile milestone keys', () => {
    expect(
      milestoneQueryKeys.profile('76561198000000000', { limit: 5, offset: 0 }),
    ).toEqual([
      'milestones',
      'profile',
      '76561198000000000',
      { limit: 5, offset: 0 },
    ]);
  });
});
