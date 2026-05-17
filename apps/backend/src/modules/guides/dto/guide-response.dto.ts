import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { GuideStatusDto, GuideVisibilityDto } from './guide-request.dto';

export class GuideAuthorResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Steam Hunter' })
  displayName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  avatarUrl!: string | null;
}

export class GuideGameResponseDto {
  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Demo Complete Quest' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  iconUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  logoUrl!: string | null;
}

export class GuideSummaryResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: '100% Roadmap' })
  title!: string;

  @ApiProperty({ type: String, example: '100-roadmap' })
  slug!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Complete route.' })
  summary!: string | null;

  @ApiProperty({ enum: GuideStatusDto, example: GuideStatusDto.Published })
  status!: string;

  @ApiProperty({ enum: GuideVisibilityDto, example: GuideVisibilityDto.Public })
  visibility!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 6 })
  estimatedDifficulty!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 20 })
  estimatedHours!: number | null;

  @ApiProperty({ type: Boolean, example: false })
  isSpoilerHeavy!: boolean;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '2026-05-17T12:00:00.000Z',
  })
  publishedAt!: string | null;

  @ApiProperty({ type: String, example: '2026-05-17T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: String, example: '2026-05-17T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ type: GuideAuthorResponseDto })
  author!: GuideAuthorResponseDto;

  @ApiProperty({ type: GuideGameResponseDto })
  game!: GuideGameResponseDto;
}

export class GuideSectionResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: String, example: 'Route Overview' })
  title!: string;

  @ApiProperty({ type: String, example: 'Start with missable achievements first.' })
  content!: string;

  @ApiProperty({ type: Number, example: 0 })
  position!: number;

  @ApiProperty({ type: String, example: '2026-05-17T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: String, example: '2026-05-17T12:00:00.000Z' })
  updatedAt!: string;
}

export class GuideAchievementResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: String, example: 'ACH_WIN_ONE_GAME' })
  apiName!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'First Win' })
  displayName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Win once.' })
  description!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  iconUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  iconGrayUrl!: string | null;

  @ApiProperty({ type: Boolean, example: false })
  hidden!: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 12.3 })
  globalPercentage!: number | null;
}

export class GuideDetailResponseDto extends GuideSummaryResponseDto {
  @ApiProperty({ type: [GuideSectionResponseDto] })
  sections!: GuideSectionResponseDto[];

  @ApiProperty({ type: [GuideAchievementResponseDto] })
  achievements!: GuideAchievementResponseDto[];
}

export class GuideListResponseDto {
  @ApiProperty({ type: [GuideSummaryResponseDto] })
  items!: GuideSummaryResponseDto[];

  @ApiProperty({ type: Number, example: 20 })
  total!: number;

  @ApiProperty({ type: Number, example: 20 })
  limit!: number;

  @ApiProperty({ type: Number, example: 0 })
  offset!: number;
}

export class AccountGuidesResponseDto {
  @ApiProperty({ type: [GuideSummaryResponseDto] })
  items!: GuideSummaryResponseDto[];
}

export class AddGuideAchievementsResponseDto {
  @ApiProperty({ type: Number, example: 2 })
  added!: number;
}
