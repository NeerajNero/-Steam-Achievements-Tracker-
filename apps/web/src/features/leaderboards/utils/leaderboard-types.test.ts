import { GetLeaderboardTypeEnum } from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import {
  getLeaderboardProfileHref,
  getLeaderboardRankClassName,
  isLeaderboardType,
  normalizeLeaderboardPagination,
} from './leaderboard-types';

describe('leaderboard helpers', () => {
  it('recognizes supported leaderboard types', () => {
    expect(isLeaderboardType(GetLeaderboardTypeEnum.CompletedGames)).toBe(true);
    expect(isLeaderboardType('psn_trophies')).toBe(false);
  });

  it('prefers public profile slugs for profile links', () => {
    expect(getLeaderboardProfileHref({ steamId: '765', publicSlug: 'nero' })).toBe(
      '/u/nero',
    );
    expect(getLeaderboardProfileHref({ steamId: '765', publicSlug: null })).toBe(
      '/profiles/765',
    );
  });

  it('normalizes pagination search params', () => {
    const params = new URLSearchParams('limit=500&offset=-1');

    expect(normalizeLeaderboardPagination(params)).toEqual({
      limit: 50,
      offset: 0,
    });
  });

  it('assigns stable rank emphasis classes', () => {
    expect(getLeaderboardRankClassName(1)).toContain('amber');
    expect(getLeaderboardRankClassName(2)).toContain('slate');
    expect(getLeaderboardRankClassName(3)).toContain('orange');
    expect(getLeaderboardRankClassName(10)).toContain('lime');
  });
});
