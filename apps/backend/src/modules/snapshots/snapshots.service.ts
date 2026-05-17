import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import {
  ProfileSnapshotsDataService,
  type ProfileSnapshot,
} from '../../db/services/profile-snapshots-data.service';
import { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import { UserSteamAccountsDataService } from '../../db/services/user-steam-accounts-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import type { ProfileSnapshotQueryDto } from './dto/profile-snapshot-query.dto';
import type {
  ProfileSnapshotResponseDto,
  ProfileSnapshotsResponseDto,
} from './dto/profile-snapshot-response.dto';

@Injectable()
export class SnapshotsService {
  constructor(
    private readonly steamProfilesDataService: SteamProfilesDataService,
    private readonly profileSnapshotsDataService: ProfileSnapshotsDataService,
    private readonly userSteamAccountsDataService: UserSteamAccountsDataService,
  ) {}

  async createProfileSnapshot(
    steamId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<ProfileSnapshotResponseDto> {
    const profile = await this.steamProfilesDataService.findBySteamId(steamId);

    if (profile === null) {
      throw new NotFoundException(`Steam profile ${steamId} was not found`);
    }

    await this.assertCanCreateSnapshot(currentUser, profile.id);

    const snapshot = await this.profileSnapshotsDataService.createForProfileId(
      profile.id,
      'manual',
    );

    if (snapshot === null) {
      throw new NotFoundException(`Steam profile ${steamId} was not found`);
    }

    return mapSnapshot(snapshot);
  }

  async listProfileSnapshots(
    steamId: string,
    query: ProfileSnapshotQueryDto,
  ): Promise<ProfileSnapshotsResponseDto> {
    const profile = await this.steamProfilesDataService.findBySteamId(steamId);

    if (profile === null) {
      throw new NotFoundException(`Steam profile ${steamId} was not found`);
    }

    const [items, total] = await Promise.all([
      this.profileSnapshotsDataService.findBySteamProfileId(profile.id, {
        limit: query.limit,
        offset: query.offset,
      }),
      this.profileSnapshotsDataService.countBySteamProfileId(profile.id),
    ]);

    return {
      steamId,
      items: items.map(mapSnapshot),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  private async assertCanCreateSnapshot(
    currentUser: AuthenticatedUserContext,
    steamProfileId: string,
  ): Promise<void> {
    if (
      currentUser.user.role === 'admin' ||
      currentUser.user.role === 'moderator'
    ) {
      return;
    }

    const account =
      await this.userSteamAccountsDataService.findByUserAndProfileId(
        currentUser.userId,
        steamProfileId,
      );

    if (account === null) {
      throw new ForbiddenException(
        'You can create snapshots only for a claimed Steam profile.',
      );
    }
  }
}

function mapSnapshot(snapshot: ProfileSnapshot): ProfileSnapshotResponseDto {
  return {
    id: snapshot.id,
    totalGames: snapshot.totalGames,
    completedGames: snapshot.completedGames,
    totalAchievements: snapshot.totalAchievements,
    unlockedAchievements: snapshot.unlockedAchievements,
    remainingAchievements: snapshot.remainingAchievements,
    averageCompletionPercentage: snapshot.averageCompletionPercentage,
    totalPlaytimeMinutes: snapshot.totalPlaytimeMinutes,
    rarestUnlockedGlobalPercentage: snapshot.rarestUnlockedGlobalPercentage,
    snapshotReason: snapshot.snapshotReason,
    createdAt: snapshot.createdAt.toISOString(),
  };
}
