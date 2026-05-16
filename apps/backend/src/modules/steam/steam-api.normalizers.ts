import type {
  SteamGameSchema,
  SteamGameSchemaAchievement,
  SteamGlobalAchievementPercentage,
  SteamOwnedGame,
  SteamPlayerAchievement,
  SteamPlayerAchievementResult,
  SteamPlayerSummary,
} from './steam-api.types';

export function normalizePlayerSummaries(raw: unknown): SteamPlayerSummary[] {
  const players = asArray(getPath(raw, ['response', 'players']));

  return players
    .map((player): SteamPlayerSummary | null => {
      const steamId = toStringOrNull(getPath(player, ['steamid']));

      if (steamId === null) {
        return null;
      }

      return {
        steamId,
        personaName: toStringOrNull(getPath(player, ['personaname'])),
        avatarUrl: toStringOrNull(getPath(player, ['avatarfull'])),
        profileUrl: toStringOrNull(getPath(player, ['profileurl'])),
        visibilityState: toNumberOrNull(
          getPath(player, ['communityvisibilitystate']),
        ),
      };
    })
    .filter(isPresent);
}

export function normalizeOwnedGames(raw: unknown): SteamOwnedGame[] {
  const games = asArray(getPath(raw, ['response', 'games']));

  return games
    .map((game): SteamOwnedGame | null => {
      const appId = toNumberOrNull(getPath(game, ['appid']));

      if (appId === null) {
        return null;
      }

      return {
        appId,
        gameName: toStringOrNull(getPath(game, ['name'])) ?? `Steam App ${appId}`,
        playtimeMinutes: toNumberOrNull(getPath(game, ['playtime_forever'])) ?? 0,
        playtimeTwoWeeksMinutes:
          toNumberOrNull(getPath(game, ['playtime_2weeks'])) ?? 0,
        lastPlayedAt: unixSecondsToDateOrNull(
          toNumberOrNull(getPath(game, ['rtime_last_played'])),
        ),
      };
    })
    .filter(isPresent);
}

export function normalizePlayerAchievements(
  raw: unknown,
  input: { steamId: string; appId: number },
): SteamPlayerAchievementResult {
  const successValue = getPath(raw, ['playerstats', 'success']);
  const achievementsValue = getPath(raw, ['playerstats', 'achievements']);
  const achievements = asArray(achievementsValue)
    .map((achievement): SteamPlayerAchievement | null => {
      const apiName = toStringOrNull(getPath(achievement, ['apiname']));

      if (apiName === null) {
        return null;
      }

      const achieved = toBoolean(getPath(achievement, ['achieved']));

      return {
        apiName,
        achieved,
        unlockedAt: achieved
          ? unixSecondsToDateOrNull(
              toNumberOrNull(getPath(achievement, ['unlocktime'])),
            )
          : null,
      };
    })
    .filter(isPresent);

  return {
    steamId:
      toStringOrNull(getPath(raw, ['playerstats', 'steamID'])) ?? input.steamId,
    appId: input.appId,
    achievements,
    isPrivateOrUnavailable:
      successValue === false ||
      (!Array.isArray(achievementsValue) && achievements.length === 0),
  };
}

export function normalizeSchemaForGame(
  raw: unknown,
  appId: number,
): SteamGameSchema {
  const achievements = asArray(
    getPath(raw, ['game', 'availableGameStats', 'achievements']),
  )
    .map((achievement): SteamGameSchemaAchievement | null => {
      const apiName = toStringOrNull(getPath(achievement, ['name']));

      if (apiName === null) {
        return null;
      }

      return {
        apiName,
        displayName: toStringOrNull(getPath(achievement, ['displayName'])),
        description: toStringOrNull(getPath(achievement, ['description'])),
        iconUrl: toStringOrNull(getPath(achievement, ['icon'])),
        iconGrayUrl: toStringOrNull(getPath(achievement, ['icongray'])),
        hidden: toBoolean(getPath(achievement, ['hidden'])),
      };
    })
    .filter(isPresent);

  return {
    appId,
    gameName: toStringOrNull(getPath(raw, ['game', 'gameName'])),
    achievements,
  };
}

export function normalizeGlobalAchievementPercentages(
  raw: unknown,
): SteamGlobalAchievementPercentage[] {
  return asArray(getPath(raw, ['achievementpercentages', 'achievements']))
    .map((achievement): SteamGlobalAchievementPercentage | null => {
      const apiName = toStringOrNull(getPath(achievement, ['name']));
      const globalPercentage = toNumberOrNull(getPath(achievement, ['percent']));

      if (apiName === null || globalPercentage === null) {
        return null;
      }

      return { apiName, globalPercentage };
    })
    .filter(isPresent);
}

function getPath(value: unknown, path: string[]): unknown {
  let current = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    return value === '1' || value.toLowerCase() === 'true';
  }

  return false;
}

function unixSecondsToDateOrNull(value: number | null): Date | null {
  if (value === null || value <= 0) {
    return null;
  }

  return new Date(value * 1000);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
