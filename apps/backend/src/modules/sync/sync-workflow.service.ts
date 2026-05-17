import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import {
  AchievementSyncDataService,
  type SyncedAchievementInput,
  type SyncedProfileAchievementInput,
} from '../../db/services/achievement-sync-data.service';
import { GamesDataService } from '../../db/services/games-data.service';
import {
  ProfileGamesDataService,
  type ProfileGameWithGame,
} from '../../db/services/profile-games-data.service';
import { ProfileSnapshotsDataService } from '../../db/services/profile-snapshots-data.service';
import {
  SteamProfilesDataService,
  type SteamProfile,
} from '../../db/services/steam-profiles-data.service';
import {
  SyncRunsDataService,
  type SyncRun,
} from '../../db/services/sync-runs-data.service';
import { CachedSteamApiClient } from '../steam/cached-steam-api.client';
import {
  SteamApiConfigError,
  SteamApiNotFoundOrPrivateError,
  SteamApiRateLimitError,
  SteamApiRequestError,
} from '../steam/steam-api.errors';
import type {
  SteamGameSchemaAchievement,
  SteamGlobalAchievementPercentage,
  SteamOwnedGame,
  SteamPlayerAchievement,
  SteamPlayerAchievementResult,
  SteamPlayerSummary,
} from '../steam/steam-api.types';
import type { SyncScope } from './dto/sync-request.dto';
import type { SyncJobData } from './sync-job.types';

const ACHIEVEMENT_SYNC_GAME_CONCURRENCY = 3;
const SYNC_SNAPSHOT_DEDUP_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class SyncWorkflowService {
  private readonly logger = new Logger(SyncWorkflowService.name);

  constructor(
    private readonly steamApiClient: CachedSteamApiClient,
    private readonly steamProfilesDataService: SteamProfilesDataService,
    private readonly gamesDataService: GamesDataService,
    private readonly profileGamesDataService: ProfileGamesDataService,
    private readonly profileSnapshotsDataService: ProfileSnapshotsDataService,
    private readonly achievementSyncDataService: AchievementSyncDataService,
    private readonly syncRunsDataService: SyncRunsDataService,
  ) {}

  async execute(jobData: SyncJobData): Promise<SyncRun> {
    if (jobData.scope === 'profile') {
      return this.syncProfileBySteamId(jobData.syncRunId, jobData.steamId);
    }

    if (jobData.scope === 'games') {
      return this.syncOwnedGamesBySteamId(jobData.syncRunId, jobData.steamId);
    }

    return this.syncAchievementsBySteamId(
      jobData.syncRunId,
      jobData.steamId,
      jobData.appIds,
    );
  }

  async syncProfileBySteamId(
    syncRunId: string,
    steamId: string,
  ): Promise<SyncRun> {
    const playerSummary = await this.fetchPlayerSummary(steamId);

    if (playerSummary === null) {
      return this.markFailedAndReturn(syncRunId, {
        errorMessage: 'Steam profile is missing, private, or unavailable.',
        metadata: { profilesSynced: 0 },
      });
    }

    const profile = await this.upsertSteamProfileFromSummary(playerSummary);
    await this.syncRunsDataService.assignProfile(syncRunId, profile.id);
    await this.createSyncCompletedSnapshotIfProfileHasGames(profile.id);

    return requireSyncRun(
      await this.syncRunsDataService.markSuccess(syncRunId, {
        profilesSynced: 1,
      }),
    );
  }

  async syncAchievementsBySteamId(
    syncRunId: string,
    steamId: string,
    appIds?: number[],
  ): Promise<SyncRun> {
    const profile = await this.steamProfilesDataService.findBySteamId(steamId);

    if (profile === null) {
      return this.markFailedAndReturn(syncRunId, {
        errorMessage:
          'Steam profile must be synced before achievements can be synced.',
        metadata: createAchievementMetadata({
          appIds,
          gamesRequested: appIds?.length ?? 0,
          gamesProcessed: 0,
          gamesSucceeded: 0,
          gamesMetadataOnly: 0,
          gamesNoAchievements: 0,
          gamesFailed: appIds?.length ?? 0,
          achievementsSynced: 0,
          profileAchievementsSynced: 0,
          unlockStateUnavailableApps: [],
          failedApps:
            appIds?.map((appId) => ({
              appId,
              reason: 'Steam profile is not stored for this sync.',
            })) ?? [],
        }),
      });
    }

    await this.syncRunsDataService.assignProfile(syncRunId, profile.id);

    const requestedAppIds = appIds === undefined ? undefined : [...new Set(appIds)];
    const profileGames =
      await this.profileGamesDataService.findProfileGamesForAchievementSync(
        profile.id,
        requestedAppIds,
      );
    const missingAppFailures = findMissingAppFailures(
      requestedAppIds,
      profileGames,
    );

    if (profileGames.length === 0 && missingAppFailures.length === 0) {
      await this.createSyncCompletedSnapshotIfProfileHasGames(profile.id);

      return requireSyncRun(
        await this.syncRunsDataService.markSuccess(
          syncRunId,
          createAchievementMetadata({
            appIds: requestedAppIds,
            gamesRequested: 0,
            gamesProcessed: 0,
            gamesSucceeded: 0,
            gamesMetadataOnly: 0,
            gamesNoAchievements: 0,
            gamesFailed: 0,
            achievementsSynced: 0,
            profileAchievementsSynced: 0,
            unlockStateUnavailableApps: [],
            failedApps: [],
          }),
        ),
      );
    }

    const gameResults = await mapWithConcurrency(
      profileGames,
      ACHIEVEMENT_SYNC_GAME_CONCURRENCY,
      (profileGame) => this.syncAchievementsForGame(profile.id, steamId, profileGame),
    );

    const failedApps = [
      ...missingAppFailures,
      ...gameResults
        .filter(isFailedGameAchievementSync)
        .map((result) => ({
          appId: result.appId,
          reason: result.reason,
        })),
    ];
    const fullSuccessResults = gameResults.filter(isFullSuccessGameAchievementSync);
    const metadataOnlyResults = gameResults.filter(
      isMetadataOnlyGameAchievementSync,
    );
    const noAchievementResults = gameResults.filter(
      isNoAchievementsGameAchievementSync,
    );
    const usefulResultsCount =
      fullSuccessResults.length +
      metadataOnlyResults.length +
      noAchievementResults.length;
    const metadata = createAchievementMetadata({
      appIds: requestedAppIds,
      gamesRequested: requestedAppIds?.length ?? profileGames.length,
      gamesProcessed: gameResults.length,
      gamesSucceeded: fullSuccessResults.length,
      gamesMetadataOnly: metadataOnlyResults.length,
      gamesNoAchievements: noAchievementResults.length,
      gamesFailed: failedApps.length,
      achievementsSynced: sumBy(gameResults, (result) => result.achievementsSynced),
      profileAchievementsSynced: sumBy(
        gameResults,
        (result) => result.profileAchievementsSynced,
      ),
      unlockStateUnavailableApps: metadataOnlyResults.map((result) => ({
        appId: result.appId,
        reason: result.reason,
      })),
      failedApps,
    });

    if (usefulResultsCount > 0 && (metadataOnlyResults.length > 0 || failedApps.length > 0)) {
      await this.createSyncCompletedSnapshotIfProfileHasGames(profile.id);

      return requireSyncRun(
        await this.syncRunsDataService.markPartialSuccess(
          syncRunId,
          'Achievement sync completed with partial failures.',
          metadata,
        ),
      );
    }

    if (usefulResultsCount > 0 || failedApps.length === 0) {
      await this.createSyncCompletedSnapshotIfProfileHasGames(profile.id);

      return requireSyncRun(
        await this.syncRunsDataService.markSuccess(syncRunId, metadata),
      );
    }

    return this.markFailedAndReturn(syncRunId, {
      errorMessage: 'Achievement sync failed for all requested games.',
      metadata,
    });
  }

  async syncOwnedGamesBySteamId(
    syncRunId: string,
    steamId: string,
  ): Promise<SyncRun> {
    const profile = await this.ensureProfileForSync(steamId);

    if (profile === null) {
      return this.markFailedAndReturn(syncRunId, {
        errorMessage: 'Steam profile is missing, private, or unavailable.',
        metadata: { gamesSynced: 0, profileGamesSynced: 0 },
      });
    }

    await this.syncRunsDataService.assignProfile(syncRunId, profile.id);

    const ownedGames = await this.steamApiClient.getOwnedGames(steamId);
    const syncedAt = new Date();

    for (const ownedGame of ownedGames) {
      await this.upsertOwnedGame(profile.id, ownedGame, syncedAt);
    }

    await this.steamProfilesDataService.updateSyncState(profile.id, {
      lastSyncedAt: syncedAt,
    });
    await this.createSyncCompletedSnapshotIfProfileHasGames(profile.id);

    return requireSyncRun(
      await this.syncRunsDataService.markSuccess(syncRunId, {
        gamesSynced: ownedGames.length,
        profileGamesSynced: ownedGames.length,
      }),
    );
  }

  private async fetchPlayerSummary(
    steamId: string,
  ): Promise<SteamPlayerSummary | null> {
    const summaries = await this.steamApiClient.getPlayerSummaries([steamId]);

    return summaries.find((summary) => summary.steamId === steamId) ?? null;
  }

  private async ensureProfileForSync(
    steamId: string,
  ): Promise<SteamProfile | null> {
    const existingProfile =
      await this.steamProfilesDataService.findBySteamId(steamId);

    if (existingProfile !== null) {
      return existingProfile;
    }

    const playerSummary = await this.fetchPlayerSummary(steamId);

    if (playerSummary === null) {
      return null;
    }

    return this.upsertSteamProfileFromSummary(playerSummary);
  }

  private async upsertSteamProfileFromSummary(
    playerSummary: SteamPlayerSummary,
  ): Promise<SteamProfile> {
    return this.steamProfilesDataService.upsertProfile({
      steamId: playerSummary.steamId,
      personaName: playerSummary.personaName,
      avatarUrl: playerSummary.avatarUrl,
      profileUrl: playerSummary.profileUrl,
      visibilityState: playerSummary.visibilityState,
      isPrivate: isPrivateVisibility(playerSummary.visibilityState),
      lastSyncedAt: new Date(),
    });
  }

  private async upsertOwnedGame(
    profileId: string,
    ownedGame: SteamOwnedGame,
    syncedAt: Date,
  ): Promise<void> {
    const game = await this.gamesDataService.upsertOwnedGame({
      steamAppId: ownedGame.appId,
      name: ownedGame.gameName,
      iconUrl: null,
      logoUrl: null,
    });

    await this.profileGamesDataService.upsertOwnedGameProgressPreservingAchievementStats(
      {
        profileId,
        gameId: game.id,
        playtimeMinutes: ownedGame.playtimeMinutes,
        playtimeTwoWeeksMinutes: ownedGame.playtimeTwoWeeksMinutes,
        lastPlayedAt: ownedGame.lastPlayedAt,
        lastSyncedAt: syncedAt,
      },
    );
  }

  private async syncAchievementsForGame(
    profileId: string,
    steamId: string,
    profileGame: ProfileGameWithGame,
  ): Promise<GameAchievementSyncResult> {
    const appId = profileGame.game.steamAppId;

    try {
      const schema = await this.steamApiClient.getSchemaForGame({
        appId,
        language: 'english',
      });
      const globalPercentages =
        await this.steamApiClient.getGlobalAchievementPercentages(appId);
      const syncedAt = new Date();
      const metadataAchievements = mergeAchievementData(
        schema.achievements,
        globalPercentages,
        [],
      );

      if (metadataAchievements.length === 0) {
        const result = await this.achievementSyncDataService.applyGameAchievementSync({
          profileId,
          steamAppId: appId,
          achievements: [],
          profileAchievements: [],
          lastSyncedAt: syncedAt,
        });

        return {
          category: 'no_achievements',
          appId,
          achievementsSynced: result.achievementsSynced,
          profileAchievementsSynced: result.profileAchievementsSynced,
        };
      }

      const metadataResult =
        await this.achievementSyncDataService.applyGameAchievementMetadata({
          steamAppId: appId,
          achievements: metadataAchievements,
        });

      const playerAchievements = await this.fetchPlayerAchievementsOrNull(
        steamId,
        appId,
      );

      if (playerAchievements === null || playerAchievements.isPrivateOrUnavailable) {
        return {
          category: 'metadata_only',
          appId,
          reason: 'Player achievements unavailable',
          achievementsSynced: metadataResult.achievementsSynced,
          profileAchievementsSynced: 0,
        };
      }

      const mergedAchievements = mergeAchievementData(
        schema.achievements,
        globalPercentages,
        playerAchievements.achievements,
      );
      const profileAchievementStates = playerAchievements.achievements.map(
        (achievement): SyncedProfileAchievementInput => ({
          apiName: achievement.apiName,
          achieved: achievement.achieved,
          unlockedAt: achievement.unlockedAt,
        }),
      );
      const result = await this.achievementSyncDataService.applyGameAchievementSync({
        profileId,
        steamAppId: appId,
        achievements: mergedAchievements,
        profileAchievements: profileAchievementStates,
        lastSyncedAt: new Date(),
      });

      return {
        category: 'full_success',
        appId,
        achievementsSynced: result.achievementsSynced,
        profileAchievementsSynced: result.profileAchievementsSynced,
      };
    } catch (error: unknown) {
      return {
        category: 'failed',
        appId,
        reason: toSafeGameSyncErrorMessage(error),
        achievementsSynced: 0,
        profileAchievementsSynced: 0,
      };
    }
  }

  private async fetchPlayerAchievementsOrNull(
    steamId: string,
    appId: number,
  ): Promise<SteamPlayerAchievementResult | null> {
    try {
      return await this.steamApiClient.getPlayerAchievements({
        steamId,
        appId,
        language: 'english',
      });
    } catch {
      return null;
    }
  }

  private async markFailedAndReturn(
    syncRunId: string,
    input: { errorMessage: string; metadata: Record<string, unknown> },
  ): Promise<SyncRun> {
    return requireSyncRun(
      await this.syncRunsDataService.markFailed(
        syncRunId,
        input.errorMessage,
        input.metadata,
      ),
    );
  }

  private async createSyncCompletedSnapshotIfProfileHasGames(
    profileId: string,
  ): Promise<void> {
    const summary = await this.profileGamesDataService.getProfileGameSummary(
      profileId,
    );

    if (summary.totalGames === 0) {
      return;
    }

    try {
      const latestSnapshot =
        await this.profileSnapshotsDataService.findLatestBySteamProfileId(
          profileId,
        );

      if (
        latestSnapshot !== null &&
        Date.now() - latestSnapshot.createdAt.getTime() <
          SYNC_SNAPSHOT_DEDUP_WINDOW_MS
      ) {
        return;
      }

      await this.profileSnapshotsDataService.createForProfileId(
        profileId,
        'sync_completed',
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Profile snapshot creation failed after sync profileId=${profileId} reason="${toSafeSnapshotErrorMessage(error)}"`,
      );
    }
  }
}

interface FailedAppMetadata {
  appId: number;
  reason: string;
}

interface AchievementMetadataInput {
  appIds?: number[];
  gamesRequested: number;
  gamesProcessed: number;
  gamesSucceeded: number;
  gamesMetadataOnly: number;
  gamesNoAchievements: number;
  gamesFailed: number;
  achievementsSynced: number;
  profileAchievementsSynced: number;
  unlockStateUnavailableApps: FailedAppMetadata[];
  failedApps: FailedAppMetadata[];
}

interface SuccessfulGameAchievementSync {
  category: 'full_success';
  appId: number;
  achievementsSynced: number;
  profileAchievementsSynced: number;
}

interface MetadataOnlyGameAchievementSync {
  category: 'metadata_only';
  appId: number;
  reason: string;
  achievementsSynced: number;
  profileAchievementsSynced: number;
}

interface NoAchievementsGameAchievementSync {
  category: 'no_achievements';
  appId: number;
  achievementsSynced: number;
  profileAchievementsSynced: number;
}

interface FailedGameAchievementSync {
  category: 'failed';
  appId: number;
  reason: string;
  achievementsSynced: number;
  profileAchievementsSynced: number;
}

type GameAchievementSyncResult =
  | SuccessfulGameAchievementSync
  | MetadataOnlyGameAchievementSync
  | NoAchievementsGameAchievementSync
  | FailedGameAchievementSync;

export function toSafeSyncErrorMessage(error: unknown): string {
  if (error instanceof SteamApiConfigError) {
    return 'STEAM_API_KEY is not configured in backend runtime environment.';
  }

  if (error instanceof SteamApiRateLimitError) {
    return 'Steam API rate limit was reached. Try again later.';
  }

  if (error instanceof SteamApiNotFoundOrPrivateError) {
    return 'Steam profile is missing, private, or unavailable.';
  }

  if (error instanceof SteamApiRequestError) {
    return 'Steam API request failed during sync.';
  }

  return 'Sync failed before it could complete.';
}

function requireSyncRun(syncRun: SyncRun | null): SyncRun {
  if (syncRun === null) {
    throw new InternalServerErrorException('Sync run could not be finalized.');
  }

  return syncRun;
}

function isPrivateVisibility(visibilityState: number | null): boolean {
  return visibilityState === null || visibilityState !== 3;
}

function createAchievementMetadata(
  input: AchievementMetadataInput,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    gamesRequested: input.gamesRequested,
    gamesProcessed: input.gamesProcessed,
    gamesSucceeded: input.gamesSucceeded,
    gamesMetadataOnly: input.gamesMetadataOnly,
    gamesNoAchievements: input.gamesNoAchievements,
    gamesFailed: input.gamesFailed,
    achievementsSynced: input.achievementsSynced,
    profileAchievementsSynced: input.profileAchievementsSynced,
    unlockStateUnavailableApps: input.unlockStateUnavailableApps,
    failedApps: input.failedApps,
  };

  if (input.appIds !== undefined) {
    metadata.appIds = input.appIds;
  }

  return metadata;
}

function findMissingAppFailures(
  requestedAppIds: number[] | undefined,
  profileGames: ProfileGameWithGame[],
): FailedAppMetadata[] {
  if (requestedAppIds === undefined) {
    return [];
  }

  const foundAppIds = new Set(
    profileGames.map((profileGame) => profileGame.game.steamAppId),
  );

  return requestedAppIds
    .filter((appId) => !foundAppIds.has(appId))
    .map((appId) => ({
      appId,
      reason: 'Game is not stored for this Steam profile.',
    }));
}

function mergeAchievementData(
  schemaAchievements: SteamGameSchemaAchievement[],
  globalPercentages: SteamGlobalAchievementPercentage[],
  playerAchievements: SteamPlayerAchievement[],
): SyncedAchievementInput[] {
  const schemaByApiName = new Map(
    schemaAchievements.map((achievement) => [achievement.apiName, achievement]),
  );
  const globalByApiName = new Map(
    globalPercentages.map((achievement) => [
      achievement.apiName,
      achievement.globalPercentage,
    ]),
  );
  const playerApiNames = playerAchievements.map((achievement) => achievement.apiName);
  const apiNames = [
    ...new Set([
      ...schemaByApiName.keys(),
      ...globalByApiName.keys(),
      ...playerApiNames,
    ]),
  ].sort();

  return apiNames.map((apiName): SyncedAchievementInput => {
    const schemaAchievement = schemaByApiName.get(apiName);

    return {
      apiName,
      displayName: schemaAchievement?.displayName ?? null,
      description: schemaAchievement?.description ?? null,
      iconUrl: schemaAchievement?.iconUrl ?? null,
      iconGrayUrl: schemaAchievement?.iconGrayUrl ?? null,
      globalPercentage: globalByApiName.get(apiName) ?? null,
      hidden: schemaAchievement?.hidden ?? false,
    };
  });
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      await worker();
    }),
  );

  return results;
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function isFullSuccessGameAchievementSync(
  result: GameAchievementSyncResult,
): result is SuccessfulGameAchievementSync {
  return result.category === 'full_success';
}

function isMetadataOnlyGameAchievementSync(
  result: GameAchievementSyncResult,
): result is MetadataOnlyGameAchievementSync {
  return result.category === 'metadata_only';
}

function isNoAchievementsGameAchievementSync(
  result: GameAchievementSyncResult,
): result is NoAchievementsGameAchievementSync {
  return result.category === 'no_achievements';
}

function isFailedGameAchievementSync(
  result: GameAchievementSyncResult,
): result is FailedGameAchievementSync {
  return result.category === 'failed';
}

function toSafeGameSyncErrorMessage(error: unknown): string {
  if (error instanceof SteamApiConfigError) {
    return 'STEAM_API_KEY is not configured in backend runtime environment.';
  }

  if (error instanceof SteamApiRateLimitError) {
    return 'Steam API rate limit was reached while syncing achievements.';
  }

  if (error instanceof SteamApiNotFoundOrPrivateError) {
    return 'Steam achievement data is missing, private, or unavailable for this game.';
  }

  if (error instanceof SteamApiRequestError) {
    return 'Steam API request failed while syncing achievements for this game.';
  }

  return 'Achievement sync failed for this game.';
}

function toSafeSnapshotErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return 'Snapshot creation failed.';
  }

  return 'Snapshot creation failed.';
}
