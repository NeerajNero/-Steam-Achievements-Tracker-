import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BadgeResponseDto, ProfileBadgeResponseDto } from '../../badges/dto/badge-response.dto';
import { ProfileMilestoneResponseDto } from '../../milestones/dto/milestone-response.dto';

export enum ShowcaseItemTypeDto {
  Badge = 'badge',
  Milestone = 'milestone',
  Achievement = 'achievement',
  Guide = 'guide',
  GamingSession = 'gaming_session',
}

export enum ShowcaseVisibilityDto {
  Public = 'public',
  Private = 'private',
}

export class ShowcaseAchievementResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'ACH_WIN_ONE_GAME' })
  apiName!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Winner' })
  displayName!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 12.3 })
  globalPercentage!: number | null;
}

export class ShowcaseGuideResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Demo Completion Roadmap' })
  title!: string;

  @ApiProperty({ type: String, example: 'demo-completion-roadmap' })
  slug!: string;
}

export class ShowcaseGamingSessionResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Co-op cleanup' })
  title!: string;

  @ApiProperty({ type: String, example: 'open' })
  status!: string;

  @ApiProperty({ type: String, example: '2026-05-17T12:00:00.000Z' })
  scheduledStartAt!: string;
}

export class ShowcaseItemResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ enum: ShowcaseItemTypeDto, example: ShowcaseItemTypeDto.Badge })
  itemType!: string;

  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  itemId!: string;

  @ApiProperty({ type: Number, example: 0 })
  position!: number;

  @ApiProperty({ enum: ShowcaseVisibilityDto, example: ShowcaseVisibilityDto.Public })
  visibility!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Favorite badge' })
  titleOverride!: string | null;

  @ApiPropertyOptional({ type: BadgeResponseDto, nullable: true })
  badge!: BadgeResponseDto | null;

  @ApiPropertyOptional({ type: ProfileBadgeResponseDto, nullable: true })
  profileBadge!: ProfileBadgeResponseDto | null;

  @ApiPropertyOptional({ type: ProfileMilestoneResponseDto, nullable: true })
  milestone!: ProfileMilestoneResponseDto | null;

  @ApiPropertyOptional({ type: ShowcaseAchievementResponseDto, nullable: true })
  achievement!: ShowcaseAchievementResponseDto | null;

  @ApiPropertyOptional({ type: ShowcaseGuideResponseDto, nullable: true })
  guide!: ShowcaseGuideResponseDto | null;

  @ApiPropertyOptional({ type: ShowcaseGamingSessionResponseDto, nullable: true })
  gamingSession!: ShowcaseGamingSessionResponseDto | null;
}

export class ProfileShowcaseResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: [ShowcaseItemResponseDto] })
  items!: ShowcaseItemResponseDto[];
}

export class AccountShowcaseResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: [ShowcaseItemResponseDto] })
  items!: ShowcaseItemResponseDto[];
}
