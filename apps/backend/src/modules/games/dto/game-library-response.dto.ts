import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ACHIEVEMENT_DATA_STATES,
  type AchievementDataState,
} from './achievement-data-state.dto';

export class GameLibraryItemResponseDto {
  @ApiProperty({ type: Number, example: 910002 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Demo Last Mile' })
  name!: string;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  iconUrl!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  hasAchievements!: boolean;

  @ApiProperty({ type: Number, example: 1240 })
  playtimeMinutes!: number;

  @ApiProperty({ type: Number, example: 45 })
  playtimeTwoWeeksMinutes!: number;

  @ApiProperty({ type: Number, example: 8 })
  totalAchievements!: number;

  @ApiProperty({ type: Number, example: 39 })
  achievementMetadataCount!: number;

  @ApiProperty({ type: Number, example: 0 })
  knownUnlockStateCount!: number;

  @ApiProperty({
    enum: ACHIEVEMENT_DATA_STATES,
    example: 'metadata_only',
  })
  achievementDataState!: AchievementDataState;

  @ApiProperty({ type: Number, example: 7 })
  unlockedAchievements!: number;

  @ApiProperty({ type: Number, example: 1 })
  remainingAchievements!: number;

  @ApiProperty({ type: Number, example: 87.5 })
  completionPercentage!: number;

  @ApiPropertyOptional({
    type: String,
    example: '2026-05-15T12:00:00.000Z',
    nullable: true,
  })
  lastPlayedAt!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-05-16T05:07:30.710Z',
    nullable: true,
  })
  lastSyncedAt!: string | null;
}

export class GameLibraryResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: Number, example: 6 })
  total!: number;

  @ApiProperty({ type: Number, example: 50 })
  limit!: number;

  @ApiProperty({ type: Number, example: 0 })
  offset!: number;

  @ApiProperty({ type: [GameLibraryItemResponseDto] })
  items!: GameLibraryItemResponseDto[];
}

export class NearestCompletionsResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: [GameLibraryItemResponseDto] })
  items!: GameLibraryItemResponseDto[];
}
