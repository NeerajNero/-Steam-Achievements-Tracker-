import { describe, expect, it } from 'vitest';

import { guideQueryKeys } from './guide-query-keys';

describe('guideQueryKeys', () => {
  it('creates stable keys for game guides and account guides', () => {
    expect(
      guideQueryKeys.gameList(910001, {
        limit: 20,
        offset: 0,
        search: 'roadmap',
      }),
    ).toEqual([
      'guides',
      'game-list',
      910001,
      { limit: 20, offset: 0, search: 'roadmap' },
    ]);

    expect(guideQueryKeys.account()).toEqual(['guides', 'account']);
  });

  it('creates stable guide detail keys', () => {
    expect(guideQueryKeys.detail(910001, 'demo-roadmap')).toEqual([
      'guides',
      'detail',
      910001,
      'demo-roadmap',
    ]);
  });
});
