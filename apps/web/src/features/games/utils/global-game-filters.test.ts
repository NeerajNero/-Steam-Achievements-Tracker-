import {
  ListGlobalGamePlayersStatusEnum,
  ListGlobalGamesOrderEnum,
  ListGlobalGamesSortEnum,
} from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import {
  getGlobalGamePlayerHref,
  parseGlobalGamePlayerFilters,
  parseGlobalGamesFilters,
  toGlobalGamesSearchParams,
} from './global-game-filters';

describe('global game filters', () => {
  it('normalizes invalid game list params to defaults', () => {
    const filters = parseGlobalGamesFilters(
      new URLSearchParams('sort=bad&order=bad&limit=999&offset=-1&hasAchievements=no'),
    );

    expect(filters).toMatchObject({
      search: '',
      hasAchievements: undefined,
      sort: ListGlobalGamesSortEnum.TrackedPlayers,
      order: ListGlobalGamesOrderEnum.Desc,
      limit: 25,
      offset: 0,
    });
  });

  it('serializes shareable game list params', () => {
    const params = toGlobalGamesSearchParams({
      search: 'portal',
      hasAchievements: true,
      sort: ListGlobalGamesSortEnum.Name,
      order: ListGlobalGamesOrderEnum.Asc,
      limit: 50,
      offset: 50,
    });

    expect(params).toContain('search=portal');
    expect(params).toContain('hasAchievements=true');
    expect(params).toContain('sort=name');
  });

  it('normalizes invalid player filters', () => {
    const filters = parseGlobalGamePlayerFilters(
      new URLSearchParams('playerStatus=bad&playerLimit=0'),
    );

    expect(filters.status).toBe(ListGlobalGamePlayersStatusEnum.All);
    expect(filters.limit).toBe(25);
  });

  it('prefers public slug links for tracked players', () => {
    expect(
      getGlobalGamePlayerHref({
        steamId: '76561198000000000',
        publicSlug: 'nero',
      }),
    ).toBe('/u/nero');

    expect(
      getGlobalGamePlayerHref({
        steamId: '76561198000000000',
        publicSlug: null,
      }),
    ).toBe('/profiles/76561198000000000');
  });
});
