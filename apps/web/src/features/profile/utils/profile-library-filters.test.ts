import {
  ListProfileGamesOrderEnum,
  ListProfileGamesSortEnum,
  ListProfileGamesStatusEnum,
} from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LIBRARY_LIMIT,
  DEFAULT_LIBRARY_OFFSET,
  parseProfileLibraryFilters,
  PROFILE_LIBRARY_DEFAULT_FILTERS,
  normalizeProfileLibraryFilters,
} from './profile-library-filters';

describe('profile library filter parsing', () => {
  it('uses defaults for invalid params', () => {
    const params = new URLSearchParams(
      'status=bogus&sort=not-a-sort&order=maybe&limit=-3&offset=-10&search= Demo ',
    );

    expect(parseProfileLibraryFilters(params)).toEqual({
      search: 'Demo',
      status: ListProfileGamesStatusEnum.All,
      sort: ListProfileGamesSortEnum.Completion,
      order: ListProfileGamesOrderEnum.Desc,
      limit: DEFAULT_LIBRARY_LIMIT,
      offset: DEFAULT_LIBRARY_OFFSET,
    });
  });

  it('trims search and preserves valid params', () => {
    const params = new URLSearchParams({
      status: ListProfileGamesStatusEnum.Incomplete,
      sort: ListProfileGamesSortEnum.Name,
      order: ListProfileGamesOrderEnum.Asc,
      limit: '50',
      offset: '5',
      search: '  test game  ',
    });

    expect(parseProfileLibraryFilters(params).search).toBe('test game');
    expect(parseProfileLibraryFilters(params).status).toBe(
      ListProfileGamesStatusEnum.Incomplete,
    );
    expect(parseProfileLibraryFilters(params).limit).toBe(50);
  });

  it('normalizes partial filters safely', () => {
    expect(
      normalizeProfileLibraryFilters({
        ...PROFILE_LIBRARY_DEFAULT_FILTERS,
        status: 'invalid' as ListProfileGamesStatusEnum,
        limit: 999,
        offset: -2,
      }),
    ).toEqual({
      ...PROFILE_LIBRARY_DEFAULT_FILTERS,
      status: ListProfileGamesStatusEnum.All,
      limit: DEFAULT_LIBRARY_LIMIT,
      offset: DEFAULT_LIBRARY_OFFSET,
      search: '',
      sort: ListProfileGamesSortEnum.Completion,
      order: ListProfileGamesOrderEnum.Desc,
    });
  });
});
