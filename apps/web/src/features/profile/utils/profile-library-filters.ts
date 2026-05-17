import {
  ListProfileGamesOrderEnum,
  ListProfileGamesSortEnum,
  ListProfileGamesStatusEnum,
} from '@steam-achievement/client-sdk';

const DEFAULT_LIBRARY_STATUS = ListProfileGamesStatusEnum.All;
const DEFAULT_LIBRARY_SORT = ListProfileGamesSortEnum.Completion;
const DEFAULT_LIBRARY_ORDER = ListProfileGamesOrderEnum.Desc;
export const DEFAULT_LIBRARY_LIMIT = 25;
const MIN_LIBRARY_LIMIT = 1;
const MAX_LIBRARY_LIMIT = 100;
export const DEFAULT_LIBRARY_OFFSET = 0;

export interface ProfileLibraryFilters {
  search: string;
  status: ListProfileGamesStatusEnum;
  sort: ListProfileGamesSortEnum;
  order: ListProfileGamesOrderEnum;
  limit: number;
  offset: number;
}

function isProfileGamesStatus(
  value: string | null,
): value is ListProfileGamesStatusEnum {
  return (
    value !== null &&
    Object.values(ListProfileGamesStatusEnum).includes(
      value as ListProfileGamesStatusEnum,
    )
  );
}

function isProfileGamesSort(
  value: string | null,
): value is ListProfileGamesSortEnum {
  return (
    value !== null &&
    Object.values(ListProfileGamesSortEnum).includes(value as ListProfileGamesSortEnum)
  );
}

function isProfileGamesOrder(
  value: string | null,
): value is ListProfileGamesOrderEnum {
  return (
    value !== null &&
    Object.values(ListProfileGamesOrderEnum).includes(
      value as ListProfileGamesOrderEnum,
    )
  );
}

export function parseProfileLibraryFilters(
  searchParams: URLSearchParams,
): ProfileLibraryFilters {
  const status =
    searchParams.get('status') !== null &&
    isProfileGamesStatus(searchParams.get('status'))
      ? (searchParams.get('status') as ListProfileGamesStatusEnum)
      : DEFAULT_LIBRARY_STATUS;

  const sort =
    searchParams.get('sort') !== null &&
    isProfileGamesSort(searchParams.get('sort'))
      ? (searchParams.get('sort') as ListProfileGamesSortEnum)
      : DEFAULT_LIBRARY_SORT;

  const order =
    searchParams.get('order') !== null &&
    isProfileGamesOrder(searchParams.get('order'))
      ? (searchParams.get('order') as ListProfileGamesOrderEnum)
      : DEFAULT_LIBRARY_ORDER;

  const rawLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const limit =
    Number.isFinite(rawLimit) &&
    Number.isInteger(rawLimit) &&
    rawLimit >= MIN_LIBRARY_LIMIT &&
    rawLimit <= MAX_LIBRARY_LIMIT
      ? rawLimit
      : DEFAULT_LIBRARY_LIMIT;

  const rawOffset = Number.parseInt(searchParams.get('offset') ?? '', 10);
  const offset =
    Number.isFinite(rawOffset) &&
    Number.isInteger(rawOffset) &&
    rawOffset >= 0
      ? rawOffset
      : DEFAULT_LIBRARY_OFFSET;

  const search = searchParams.get('search')?.trim() ?? '';

  return {
    search,
    status,
    sort,
    order,
    limit,
    offset,
  };
}

export function toProfileLibrarySearchParams(
  filters: ProfileLibraryFilters,
): string {
  const params = new URLSearchParams();

  if (filters.search.length > 0) {
    params.set('search', filters.search);
  }

  params.set('status', filters.status);
  params.set('sort', filters.sort);
  params.set('order', filters.order);
  params.set('limit', String(filters.limit));
  params.set('offset', String(filters.offset));

  return params.toString();
}

export const PROFILE_LIBRARY_DEFAULT_FILTERS: ProfileLibraryFilters = {
  search: '',
  status: DEFAULT_LIBRARY_STATUS,
  sort: DEFAULT_LIBRARY_SORT,
  order: DEFAULT_LIBRARY_ORDER,
  limit: DEFAULT_LIBRARY_LIMIT,
  offset: DEFAULT_LIBRARY_OFFSET,
};

export function normalizeProfileLibraryFilters(
  partial: Partial<ProfileLibraryFilters>,
): ProfileLibraryFilters {
  const status =
    partial.status !== undefined &&
    Object.values(ListProfileGamesStatusEnum).includes(partial.status)
      ? partial.status
      : DEFAULT_LIBRARY_STATUS;

  const sort =
    partial.sort !== undefined && Object.values(ListProfileGamesSortEnum).includes(partial.sort)
      ? partial.sort
      : DEFAULT_LIBRARY_SORT;

  const order =
    partial.order !== undefined &&
    Object.values(ListProfileGamesOrderEnum).includes(partial.order)
      ? partial.order
      : DEFAULT_LIBRARY_ORDER;

  const limit =
    partial.limit !== undefined &&
    Number.isInteger(partial.limit) &&
    partial.limit >= MIN_LIBRARY_LIMIT &&
    partial.limit <= MAX_LIBRARY_LIMIT
      ? partial.limit
      : DEFAULT_LIBRARY_LIMIT;

  const offset =
    partial.offset !== undefined && Number.isInteger(partial.offset) && partial.offset >= 0
      ? partial.offset
      : DEFAULT_LIBRARY_OFFSET;

  return {
    search: partial.search?.trim() ?? '',
    status,
    sort,
    order,
    limit,
    offset,
  };
}
