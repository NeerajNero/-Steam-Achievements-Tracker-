import type { ListGlobalSessionsStatusEnum } from '@steam-achievement/client-sdk';

const SESSION_STATUSES = ['open', 'full', 'completed', 'cancelled'] as const;

export interface SessionListFilters {
  status: ListGlobalSessionsStatusEnum;
  limit: number;
  offset: number;
}

export function parseSessionListFilters(
  searchParams: URLSearchParams,
): SessionListFilters {
  return normalizeSessionListFilters({
    status: searchParams.get('status') ?? undefined,
    limit: numberOrUndefined(searchParams.get('limit')),
    offset: numberOrUndefined(searchParams.get('offset')),
  });
}

export function normalizeSessionListFilters(input: {
  status?: string;
  limit?: number;
  offset?: number;
}): SessionListFilters {
  return {
    status: SESSION_STATUSES.includes(input.status as ListGlobalSessionsStatusEnum)
      ? (input.status as ListGlobalSessionsStatusEnum)
      : 'open',
    limit:
      input.limit !== undefined && input.limit >= 1 && input.limit <= 100
        ? input.limit
        : 20,
    offset:
      input.offset !== undefined && input.offset >= 0 ? Math.floor(input.offset) : 0,
  };
}

export function toSessionListSearchParams(filters: SessionListFilters): string {
  const params = new URLSearchParams();
  params.set('status', filters.status);
  params.set('limit', String(filters.limit));
  params.set('offset', String(filters.offset));
  return params.toString();
}

function numberOrUndefined(value: string | null): number | undefined {
  if (value === null || value.length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
