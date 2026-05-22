import { GetLeaderboardTypeEnum } from '@steam-achievement/client-sdk';

export const DEFAULT_LEADERBOARD_LIMIT = 50;
export const DEFAULT_LEADERBOARD_OFFSET = 0;

export const leaderboardTypeLabels: Record<GetLeaderboardTypeEnum, string> = {
  [GetLeaderboardTypeEnum.CompletionPercentage]: 'Completion Percentage',
  [GetLeaderboardTypeEnum.CompletedGames]: 'Completed Games',
  [GetLeaderboardTypeEnum.UnlockedAchievements]: 'Unlocked Achievements',
  [GetLeaderboardTypeEnum.RarestUnlocks]: 'Rarest Unlocks',
};

export const leaderboardTypeDescriptions: Record<GetLeaderboardTypeEnum, string> = {
  [GetLeaderboardTypeEnum.CompletionPercentage]:
    'Profiles ranked by latest average completion percentage.',
  [GetLeaderboardTypeEnum.CompletedGames]:
    'Profiles ranked by latest completed game count.',
  [GetLeaderboardTypeEnum.UnlockedAchievements]:
    'Profiles ranked by latest unlocked achievement count.',
  [GetLeaderboardTypeEnum.RarestUnlocks]:
    'Profiles ranked by the rarest unlocked global achievement percentage.',
};

export function isLeaderboardType(value: string): value is GetLeaderboardTypeEnum {
  return Object.values(GetLeaderboardTypeEnum).includes(
    value as GetLeaderboardTypeEnum,
  );
}

export function getLeaderboardLabel(type: GetLeaderboardTypeEnum): string {
  return leaderboardTypeLabels[type];
}

export function getLeaderboardDescription(type: GetLeaderboardTypeEnum): string {
  return leaderboardTypeDescriptions[type];
}

export function getLeaderboardProfileHref(
  player: Readonly<{ publicSlug?: string | null; steamId: string }>,
): string {
  if (player.publicSlug && player.publicSlug.length > 0) {
    return `/u/${encodeURIComponent(player.publicSlug)}`;
  }

  return `/profiles/${encodeURIComponent(player.steamId)}`;
}

export function normalizeLeaderboardPagination(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
} {
  const rawLimit = Number(searchParams.get('limit'));
  const rawOffset = Number(searchParams.get('offset'));
  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 100
      ? rawLimit
      : DEFAULT_LEADERBOARD_LIMIT;
  const offset =
    Number.isInteger(rawOffset) && rawOffset >= 0
      ? rawOffset
      : DEFAULT_LEADERBOARD_OFFSET;

  return { limit, offset };
}

export function getLeaderboardRankClassName(rank: number): string {
  if (rank === 1) {
    return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
  }

  if (rank === 2) {
    return 'border-slate-300/30 bg-slate-300/10 text-slate-100';
  }

  if (rank === 3) {
    return 'border-orange-300/30 bg-orange-300/10 text-orange-100';
  }

  return 'border-lime-300/20 bg-lime-400/10 text-lime-100';
}
