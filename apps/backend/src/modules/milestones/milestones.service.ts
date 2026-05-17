import { Injectable, NotFoundException } from '@nestjs/common';

import {
  ProfileMilestonesDataService,
  type ProfileMilestone,
} from '../../db/services/profile-milestones-data.service';
import { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import type { MilestoneQueryDto } from './dto/milestone-query.dto';
import type {
  ProfileMilestoneResponseDto,
  ProfileMilestonesResponseDto,
} from './dto/milestone-response.dto';

@Injectable()
export class MilestonesService {
  constructor(
    private readonly steamProfilesDataService: SteamProfilesDataService,
    private readonly profileMilestonesDataService: ProfileMilestonesDataService,
  ) {}

  async listProfileMilestones(
    steamId: string,
    query: MilestoneQueryDto,
  ): Promise<ProfileMilestonesResponseDto> {
    const profile = await this.steamProfilesDataService.findBySteamId(steamId);

    if (profile === null) {
      throw new NotFoundException(`Steam profile ${steamId} was not found`);
    }

    const [items, total] = await Promise.all([
      this.profileMilestonesDataService.findBySteamProfileId(profile.id, {
        limit: query.limit,
        offset: query.offset,
      }),
      this.profileMilestonesDataService.countBySteamProfileId(profile.id),
    ]);

    return {
      steamId,
      items: items.map(mapMilestone),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }
}

function mapMilestone(
  milestone: ProfileMilestone,
): ProfileMilestoneResponseDto {
  return {
    id: milestone.id,
    milestoneType: milestone.milestoneType,
    thresholdValue: milestone.thresholdValue,
    title: milestone.title,
    description: milestone.description,
    achievedAt: milestone.achievedAt.toISOString(),
    metadata: milestone.metadata,
  };
}
