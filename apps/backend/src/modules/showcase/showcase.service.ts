import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ProfileShowcaseItemsDataService,
  type ProfileShowcaseItemType,
  type ProfileShowcaseItemWithDetails,
  type ProfileShowcaseVisibility,
  type ReplaceProfileShowcaseItemInput,
} from '../../db/services/profile-showcase-items-data.service';
import { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import { UserSteamAccountsDataService } from '../../db/services/user-steam-accounts-data.service';
import { mapBadge } from '../badges/badges.service';
import type { UpdateAccountShowcaseDto } from './dto/update-account-showcase.dto';
import type {
  AccountShowcaseResponseDto,
  ProfileShowcaseResponseDto,
  ShowcaseItemResponseDto,
} from './dto/showcase-response.dto';

const MAX_SHOWCASE_ITEMS = 6;

@Injectable()
export class ShowcaseService {
  constructor(
    private readonly steamProfilesDataService: SteamProfilesDataService,
    private readonly userSteamAccountsDataService: UserSteamAccountsDataService,
    private readonly profileShowcaseItemsDataService: ProfileShowcaseItemsDataService,
  ) {}

  async listProfileShowcase(steamId: string): Promise<ProfileShowcaseResponseDto> {
    const profile = await this.steamProfilesDataService.findBySteamId(steamId);

    if (profile === null) {
      throw new NotFoundException(`Steam profile ${steamId} was not found`);
    }

    const items = await this.profileShowcaseItemsDataService.findPublicBySteamProfileId(
      profile.id,
    );

    return {
      steamId,
      items: items.map(mapShowcaseItem),
    };
  }

  async getAccountShowcase(userId: string): Promise<AccountShowcaseResponseDto> {
    const account = await this.getPrimaryAccount(userId);
    const items = await this.profileShowcaseItemsDataService.findBySteamProfileId(
      account.steamProfileId,
    );

    return {
      steamId: account.steamId,
      items: items.map(mapShowcaseItem),
    };
  }

  async updateAccountShowcase(
    userId: string,
    input: UpdateAccountShowcaseDto,
  ): Promise<AccountShowcaseResponseDto> {
    const account = await this.getPrimaryAccount(userId);
    const items = normalizeShowcaseItems(input.items);
    await this.assertShowcaseItemsAreEligible(account.steamProfileId, userId, items);
    await this.profileShowcaseItemsDataService.replaceForProfile({
      steamProfileId: account.steamProfileId,
      ownerUserId: userId,
      items,
    });

    return this.getAccountShowcase(userId);
  }

  private async getPrimaryAccount(userId: string) {
    const account =
      await this.userSteamAccountsDataService.findPrimaryByUserId(userId);

    if (account === null) {
      throw new NotFoundException('No linked Steam profile was found.');
    }

    return account;
  }

  private async assertShowcaseItemsAreEligible(
    steamProfileId: string,
    ownerUserId: string,
    items: ReplaceProfileShowcaseItemInput[],
  ): Promise<void> {
    const invalidBadgeIds =
      await this.profileShowcaseItemsDataService.findInvalidEarnedBadgeIds(
        steamProfileId,
        items
          .filter((item) => item.itemType === 'badge')
          .map((item) => item.itemId),
      );

    if (invalidBadgeIds.length > 0) {
      throw new BadRequestException('Showcase includes an unearned badge.');
    }

    const invalidMilestoneIds =
      await this.profileShowcaseItemsDataService.findInvalidMilestoneIds(
        steamProfileId,
        items
          .filter((item) => item.itemType === 'milestone')
          .map((item) => item.itemId),
      );

    if (invalidMilestoneIds.length > 0) {
      throw new BadRequestException(
        'Showcase includes a milestone from another Steam profile.',
      );
    }

    const invalidAchievementIds =
      await this.profileShowcaseItemsDataService.findInvalidAchievementIds(
        steamProfileId,
        items
          .filter((item) => item.itemType === 'achievement')
          .map((item) => item.itemId),
      );

    if (invalidAchievementIds.length > 0) {
      throw new BadRequestException(
        'Showcase includes an achievement from another Steam profile.',
      );
    }

    const invalidGuideIds =
      await this.profileShowcaseItemsDataService.findInvalidGuideIds(
        ownerUserId,
        items
          .filter((item) => item.itemType === 'guide')
          .map((item) => ({ id: item.itemId, visibility: item.visibility })),
      );

    if (invalidGuideIds.length > 0) {
      throw new BadRequestException('Showcase includes an ineligible guide.');
    }

    const invalidSessionIds =
      await this.profileShowcaseItemsDataService.findInvalidGamingSessionIds(
        ownerUserId,
        items
          .filter((item) => item.itemType === 'gaming_session')
          .map((item) => ({ id: item.itemId, visibility: item.visibility })),
      );

    if (invalidSessionIds.length > 0) {
      throw new BadRequestException(
        'Showcase includes an ineligible gaming session.',
      );
    }
  }
}

function normalizeShowcaseItems(
  items: Array<{
    itemType: ProfileShowcaseItemType;
    itemId: string;
    position: number;
    visibility: ProfileShowcaseVisibility;
    titleOverride?: string | null;
  }>,
): ReplaceProfileShowcaseItemInput[] {
  if (items.length > MAX_SHOWCASE_ITEMS) {
    throw new BadRequestException(`Showcase supports at most ${MAX_SHOWCASE_ITEMS} items.`);
  }

  const positions = new Set<number>();
  const itemKeys = new Set<string>();

  return items.map((item) => {
    if (positions.has(item.position)) {
      throw new BadRequestException('Showcase item positions must be unique.');
    }

    positions.add(item.position);
    const key = `${item.itemType}:${item.itemId}`;

    if (itemKeys.has(key)) {
      throw new BadRequestException('Showcase items must be unique.');
    }

    itemKeys.add(key);

    const titleOverride =
      item.titleOverride === undefined || item.titleOverride === null
        ? null
        : item.titleOverride.trim();

    return {
      itemType: item.itemType,
      itemId: item.itemId,
      position: item.position,
      visibility: item.visibility,
      titleOverride:
        titleOverride === null || titleOverride.length === 0
          ? null
          : titleOverride,
    };
  });
}

function mapShowcaseItem(row: ProfileShowcaseItemWithDetails): ShowcaseItemResponseDto {
  return {
    id: row.item.id,
    itemType: row.item.itemType,
    itemId: row.item.itemId,
    position: row.item.position,
    visibility: row.item.visibility,
    titleOverride: row.item.titleOverride,
    badge: row.badge === null ? null : mapBadge(row.badge),
    profileBadge:
      row.badge === null || row.profileBadge === null
        ? null
        : {
            id: row.profileBadge.id,
            badge: mapBadge(row.badge),
            sourceMilestoneId: row.profileBadge.sourceMilestoneId,
            earnedAt: row.profileBadge.earnedAt.toISOString(),
            metadata: row.profileBadge.metadata,
          },
    milestone:
      row.milestone === null
        ? null
        : {
            id: row.milestone.id,
            milestoneType: row.milestone.milestoneType,
            thresholdValue: row.milestone.thresholdValue,
            title: row.milestone.title,
            description: row.milestone.description,
            achievedAt: row.milestone.achievedAt.toISOString(),
            metadata: row.milestone.metadata,
          },
    achievement:
      row.achievement === null
        ? null
        : {
            id: row.achievement.id,
            steamAppId: row.achievement.steamAppId,
            apiName: row.achievement.apiName,
            displayName: row.achievement.displayName,
            globalPercentage: row.achievement.globalPercentage,
          },
    guide:
      row.guide === null
        ? null
        : {
            id: row.guide.id,
            steamAppId: row.guide.steamAppId,
            title: row.guide.title,
            slug: row.guide.slug,
          },
    gamingSession:
      row.gamingSession === null
        ? null
        : {
            id: row.gamingSession.id,
            steamAppId: row.gamingSession.steamAppId,
            title: row.gamingSession.title,
            status: row.gamingSession.status,
            scheduledStartAt: row.gamingSession.scheduledStartAt.toISOString(),
          },
  };
}
