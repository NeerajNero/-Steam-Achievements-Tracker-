import { ApiProperty } from '@nestjs/swagger';

export const LEADERBOARD_TYPES = [
  'completion_percentage',
  'completed_games',
  'unlocked_achievements',
  'rarest_unlocks',
] as const;

export type LeaderboardTypeDto = (typeof LEADERBOARD_TYPES)[number];

export class LeaderboardTypeResponseDto {
  @ApiProperty({ enum: LEADERBOARD_TYPES })
  type!: LeaderboardTypeDto;

  @ApiProperty({ type: String })
  label!: string;

  @ApiProperty({ type: String })
  description!: string;
}

export class LeaderboardsResponseDto {
  @ApiProperty({ type: [LeaderboardTypeResponseDto] })
  items!: LeaderboardTypeResponseDto[];
}

export class LeaderboardSnapshotResponseDto {
  @ApiProperty({ type: Number })
  totalGames!: number;

  @ApiProperty({ type: Number })
  completedGames!: number;

  @ApiProperty({ type: Number })
  totalAchievements!: number;

  @ApiProperty({ type: Number })
  unlockedAchievements!: number;

  @ApiProperty({ type: Number })
  remainingAchievements!: number;

  @ApiProperty({ type: Number })
  averageCompletionPercentage!: number;

  @ApiProperty({ type: Number, nullable: true })
  rarestUnlockedGlobalPercentage!: number | null;

  @ApiProperty({ type: String })
  createdAt!: string;
}

export class LeaderboardItemResponseDto {
  @ApiProperty({ type: Number })
  rank!: number;

  @ApiProperty({ type: String })
  steamId!: string;

  @ApiProperty({ type: String, nullable: true })
  personaName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ type: String, nullable: true })
  publicSlug!: string | null;

  @ApiProperty({ type: Number })
  score!: number;

  @ApiProperty({ type: LeaderboardSnapshotResponseDto })
  snapshot!: LeaderboardSnapshotResponseDto;
}

export class LeaderboardResponseDto {
  @ApiProperty({ enum: LEADERBOARD_TYPES })
  type!: LeaderboardTypeDto;

  @ApiProperty({ type: [LeaderboardItemResponseDto] })
  items!: LeaderboardItemResponseDto[];

  @ApiProperty({ type: Number })
  limit!: number;

  @ApiProperty({ type: Number })
  offset!: number;
}
