export interface SteamPlayerSummary {
  steamId: string;
  personaName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  visibilityState: number | null;
}

export interface SteamOwnedGame {
  appId: number;
  gameName: string;
  iconUrl: string | null;
  logoUrl: string | null;
  playtimeMinutes: number;
  playtimeTwoWeeksMinutes: number;
  lastPlayedAt: Date | null;
}

export interface SteamRecentlyPlayedGame {
  appId: number;
  gameName: string;
  iconUrl: string | null;
  logoUrl: string | null;
  playtimeMinutes: number;
  playtimeTwoWeeksMinutes: number;
}

export interface SteamPlayerAchievement {
  apiName: string;
  achieved: boolean;
  unlockedAt: Date | null;
}

export interface SteamPlayerAchievementResult {
  steamId: string;
  appId: number;
  achievements: SteamPlayerAchievement[];
  isPrivateOrUnavailable: boolean;
}

export interface SteamGameSchemaAchievement {
  apiName: string;
  displayName: string | null;
  description: string | null;
  iconUrl: string | null;
  iconGrayUrl: string | null;
  hidden: boolean;
}

export interface SteamGameSchema {
  appId: number;
  gameName: string | null;
  achievements: SteamGameSchemaAchievement[];
}

export interface SteamGlobalAchievementPercentage {
  apiName: string;
  globalPercentage: number;
}

export interface SteamPlayerSummariesRawResponse {
  response?: {
    players?: SteamPlayerSummaryRaw[];
  };
}

export interface SteamPlayerSummaryRaw {
  steamid?: unknown;
  personaname?: unknown;
  avatarfull?: unknown;
  profileurl?: unknown;
  communityvisibilitystate?: unknown;
}

export interface SteamOwnedGamesRawResponse {
  response?: {
    game_count?: unknown;
    games?: SteamOwnedGameRaw[];
  };
}

export interface SteamOwnedGameRaw {
  appid?: unknown;
  name?: unknown;
  img_icon_url?: unknown;
  img_logo_url?: unknown;
  playtime_forever?: unknown;
  playtime_2weeks?: unknown;
  rtime_last_played?: unknown;
}

export interface SteamRecentlyPlayedGamesRawResponse {
  response?: {
    total_count?: unknown;
    games?: SteamRecentlyPlayedGameRaw[];
  };
}

export interface SteamRecentlyPlayedGameRaw {
  appid?: unknown;
  name?: unknown;
  img_icon_url?: unknown;
  img_logo_url?: unknown;
  playtime_forever?: unknown;
  playtime_2weeks?: unknown;
}

export interface SteamPlayerAchievementsRawResponse {
  playerstats?: {
    steamID?: unknown;
    gameName?: unknown;
    success?: unknown;
    achievements?: SteamPlayerAchievementRaw[];
  };
}

export interface SteamPlayerAchievementRaw {
  apiname?: unknown;
  achieved?: unknown;
  unlocktime?: unknown;
}

export interface SteamGameSchemaRawResponse {
  game?: {
    gameName?: unknown;
    availableGameStats?: {
      achievements?: SteamGameSchemaAchievementRaw[];
    };
  };
}

export interface SteamGameSchemaAchievementRaw {
  name?: unknown;
  displayName?: unknown;
  description?: unknown;
  icon?: unknown;
  icongray?: unknown;
  hidden?: unknown;
}

export interface SteamGlobalAchievementPercentagesRawResponse {
  achievementpercentages?: {
    achievements?: SteamGlobalAchievementPercentageRaw[];
  };
}

export interface SteamGlobalAchievementPercentageRaw {
  name?: unknown;
  percent?: unknown;
}
