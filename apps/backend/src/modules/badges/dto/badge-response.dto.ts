import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BadgeTypeDto {
  Milestone = 'milestone',
  Completion = 'completion',
  Rarity = 'rarity',
  Community = 'community',
  Special = 'special',
}

export enum BadgeTierDto {
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
  Platinum = 'platinum',
}

export class BadgeResponseDto {
  @ApiProperty({ type: String, example: '7f984118-70f5-40d1-a43a-b721ba0f86b0' })
  id!: string;

  @ApiProperty({ type: String, example: 'first-sync' })
  code!: string;

  @ApiProperty({ type: String, example: 'First Sync' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ enum: BadgeTypeDto, example: BadgeTypeDto.Milestone })
  badgeType!: string;

  @ApiPropertyOptional({ enum: BadgeTierDto, nullable: true, example: BadgeTierDto.Bronze })
  tier!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'spark' })
  iconKey!: string | null;

  @ApiProperty({ type: Number, example: 10 })
  sortOrder!: number;
}

export class BadgeListResponseDto {
  @ApiProperty({ type: [BadgeResponseDto] })
  items!: BadgeResponseDto[];
}

export class ProfileBadgeResponseDto {
  @ApiProperty({ type: String, example: '03c8f042-f72e-452e-87f1-62c65d1d1f9e' })
  id!: string;

  @ApiProperty({ type: BadgeResponseDto })
  badge!: BadgeResponseDto;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95',
  })
  sourceMilestoneId!: string | null;

  @ApiProperty({ type: String, example: '2026-05-17T12:00:00.000Z' })
  earnedAt!: string;

  @ApiProperty({ type: Object, example: { badgeCode: 'first-sync' } })
  metadata!: Record<string, unknown>;
}

export class ProfileBadgesResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: [ProfileBadgeResponseDto] })
  items!: ProfileBadgeResponseDto[];
}
