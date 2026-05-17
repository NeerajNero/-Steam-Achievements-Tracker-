import { Injectable, NotFoundException } from '@nestjs/common';

import { BadgesDataService, type Badge } from '../../db/services/badges-data.service';
import {
  ProfileBadgesDataService,
  type ProfileBadgeWithBadge,
} from '../../db/services/profile-badges-data.service';
import { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import type {
  BadgeListResponseDto,
  BadgeResponseDto,
  ProfileBadgesResponseDto,
  ProfileBadgeResponseDto,
} from './dto/badge-response.dto';

@Injectable()
export class BadgesService {
  constructor(
    private readonly badgesDataService: BadgesDataService,
    private readonly profileBadgesDataService: ProfileBadgesDataService,
    private readonly steamProfilesDataService: SteamProfilesDataService,
  ) {}

  async listBadges(): Promise<BadgeListResponseDto> {
    const badges = await this.badgesDataService.findActive();
    return { items: badges.map(mapBadge) };
  }

  async listProfileBadges(steamId: string): Promise<ProfileBadgesResponseDto> {
    const profile = await this.steamProfilesDataService.findBySteamId(steamId);

    if (profile === null) {
      throw new NotFoundException(`Steam profile ${steamId} was not found`);
    }

    const rows = await this.profileBadgesDataService.findBySteamProfileId(profile.id);

    return {
      steamId,
      items: rows.map(mapProfileBadge),
    };
  }
}

export function mapBadge(badge: Badge): BadgeResponseDto {
  return {
    id: badge.id,
    code: badge.code,
    name: badge.name,
    description: badge.description,
    badgeType: badge.badgeType,
    tier: badge.tier,
    iconKey: badge.iconKey,
    sortOrder: badge.sortOrder,
  };
}

function mapProfileBadge(row: ProfileBadgeWithBadge): ProfileBadgeResponseDto {
  return {
    id: row.profileBadge.id,
    badge: mapBadge(row.badge),
    sourceMilestoneId: row.profileBadge.sourceMilestoneId,
    earnedAt: row.profileBadge.earnedAt.toISOString(),
    metadata: row.profileBadge.metadata,
  };
}
