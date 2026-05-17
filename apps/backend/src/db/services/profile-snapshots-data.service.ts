import { Injectable } from '@nestjs/common';

import {
  ProfileSnapshotsRepository,
  type ProfileSnapshot,
  type SnapshotReason,
} from '../repositories/profile-snapshots.repository';

export type {
  ProfileSnapshot,
  SnapshotReason,
} from '../repositories/profile-snapshots.repository';

@Injectable()
export class ProfileSnapshotsDataService {
  constructor(
    private readonly profileSnapshotsRepository: ProfileSnapshotsRepository,
  ) {}

  async createForProfileId(
    steamProfileId: string,
    reason: SnapshotReason,
  ): Promise<ProfileSnapshot | null> {
    return this.profileSnapshotsRepository.createForProfileId(
      steamProfileId,
      reason,
    );
  }

  async findBySteamProfileId(
    steamProfileId: string,
    input: { limit: number; offset: number },
  ): Promise<ProfileSnapshot[]> {
    return this.profileSnapshotsRepository.findBySteamProfileId(
      steamProfileId,
      input,
    );
  }

  async findLatestBySteamProfileId(
    steamProfileId: string,
  ): Promise<ProfileSnapshot | null> {
    const rows = await this.profileSnapshotsRepository.findBySteamProfileId(
      steamProfileId,
      { limit: 1, offset: 0 },
    );

    return rows[0] ?? null;
  }

  async countBySteamProfileId(steamProfileId: string): Promise<number> {
    return this.profileSnapshotsRepository.countBySteamProfileId(steamProfileId);
  }
}
