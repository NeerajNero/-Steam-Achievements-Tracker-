import {
  ListGameAchievementsOrderEnum,
  ListGameAchievementsSortEnum,
  ListGameAchievementsStatusEnum,
} from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import { parseGameAchievementFilters } from './game-achievement-filters';

describe('game achievement filter parsing', () => {
  it('falls back to defaults when params are invalid', () => {
    const params = new URLSearchParams(
      'status=oops&sort=bad&order=wrong',
    );

    expect(parseGameAchievementFilters(params)).toEqual({
      status: ListGameAchievementsStatusEnum.All,
      sort: ListGameAchievementsSortEnum.Rarity,
      order: ListGameAchievementsOrderEnum.Asc,
    });
  });

  it('normalizes valid params and keeps order', () => {
    const params = new URLSearchParams(
      'status=unlocked&sort=name&order=desc',
    );

    expect(parseGameAchievementFilters(params)).toEqual({
      status: ListGameAchievementsStatusEnum.Unlocked,
      sort: ListGameAchievementsSortEnum.Name,
      order: ListGameAchievementsOrderEnum.Desc,
    });
  });
});
