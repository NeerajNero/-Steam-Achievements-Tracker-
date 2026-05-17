import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GlobalGameItemResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Demo First Steps' })
  name!: string;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  iconUrl!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  hasAchievements!: boolean;

  @ApiProperty({ type: Number, example: 12 })
  trackedPlayers!: number;

  @ApiProperty({ type: Number, example: 50 })
  totalAchievements!: number;

  @ApiProperty({ type: Number, example: 42.34 })
  averageCompletionPercentage!: number;

  @ApiProperty({ type: Number, example: 3 })
  completedPlayers!: number;

  @ApiProperty({ type: Number, example: 12345 })
  totalPlaytimeMinutes!: number;
}

export class GlobalGamesResponseDto {
  @ApiProperty({ type: [GlobalGameItemResponseDto] })
  items!: GlobalGameItemResponseDto[];

  @ApiProperty({ type: Number, example: 100 })
  total!: number;

  @ApiProperty({ type: Number, example: 25 })
  limit!: number;

  @ApiProperty({ type: Number, example: 0 })
  offset!: number;
}

export class GlobalGameStatsResponseDto {
  @ApiProperty({ type: Number, example: 12 })
  trackedPlayers!: number;

  @ApiProperty({ type: Number, example: 3 })
  completedPlayers!: number;

  @ApiProperty({ type: Number, example: 50 })
  totalAchievements!: number;

  @ApiProperty({ type: Number, example: 42.34 })
  averageCompletionPercentage!: number;

  @ApiProperty({ type: Number, example: 12345 })
  totalPlaytimeMinutes!: number;

  @ApiProperty({ type: Number, example: 234 })
  averagePlaytimeMinutes!: number;
}

export class GlobalGameMetadataResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Demo First Steps' })
  name!: string;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  iconUrl!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  hasAchievements!: boolean;
}

export class GlobalGameDetailResponseDto {
  @ApiProperty({ type: GlobalGameMetadataResponseDto })
  game!: GlobalGameMetadataResponseDto;

  @ApiProperty({ type: GlobalGameStatsResponseDto })
  stats!: GlobalGameStatsResponseDto;
}

export class GlobalGameAchievementResponseDto {
  @ApiProperty({ type: String, example: 'ACH_WIN_ONE_GAME' })
  apiName!: string;

  @ApiPropertyOptional({ type: String, example: 'First Win', nullable: true })
  displayName!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Win one match.',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  iconUrl!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  iconGrayUrl!: string | null;

  @ApiProperty({ type: Boolean, example: false })
  hidden!: boolean;

  @ApiPropertyOptional({ type: Number, example: 12.3, nullable: true })
  globalPercentage!: number | null;
}

export class GlobalGameAchievementsResponseDto {
  @ApiProperty({ type: [GlobalGameAchievementResponseDto] })
  items!: GlobalGameAchievementResponseDto[];

  @ApiProperty({ type: Number, example: 50 })
  total!: number;

  @ApiProperty({ type: Number, example: 100 })
  limit!: number;

  @ApiProperty({ type: Number, example: 0 })
  offset!: number;
}

export class GlobalGamePlayerResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiPropertyOptional({ type: String, example: 'Player', nullable: true })
  personaName!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  profileUrl!: string | null;

  @ApiProperty({ type: Number, example: 1234 })
  playtimeMinutes!: number;

  @ApiProperty({ type: Number, example: 50 })
  totalAchievements!: number;

  @ApiProperty({ type: Number, example: 42 })
  unlockedAchievements!: number;

  @ApiProperty({ type: Number, example: 84 })
  completionPercentage!: number;

  @ApiPropertyOptional({
    type: String,
    example: '2026-05-15T12:00:00.000Z',
    nullable: true,
  })
  lastPlayedAt!: string | null;

  @ApiPropertyOptional({ type: String, example: 'nero', nullable: true })
  publicSlug!: string | null;
}

export class GlobalGamePlayersResponseDto {
  @ApiProperty({ type: [GlobalGamePlayerResponseDto] })
  items!: GlobalGamePlayerResponseDto[];

  @ApiProperty({ type: Number, example: 12 })
  total!: number;

  @ApiProperty({ type: Number, example: 25 })
  limit!: number;

  @ApiProperty({ type: Number, example: 0 })
  offset!: number;
}
