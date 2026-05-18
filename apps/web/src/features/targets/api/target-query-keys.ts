import type {
  ListAccountTargetsStatusEnum,
  ListAccountTargetsTypeEnum,
} from '@steam-achievement/client-sdk';

export interface AccountTargetsQueryOptions {
  status?: ListAccountTargetsStatusEnum;
  type?: ListAccountTargetsTypeEnum;
  limit?: number;
  offset?: number;
}

export const targetQueryKeys = {
  all: ['targets'] as const,
  lists: () => [...targetQueryKeys.all, 'list'] as const,
  list: (options: AccountTargetsQueryOptions = {}) =>
    [...targetQueryKeys.lists(), normalizeTargetQueryOptions(options)] as const,
} as const;

function normalizeTargetQueryOptions(
  options: AccountTargetsQueryOptions,
): AccountTargetsQueryOptions {
  return {
    status: options.status ?? undefined,
    type: options.type ?? undefined,
    limit: options.limit ?? 50,
    offset: options.offset ?? 0,
  };
}
