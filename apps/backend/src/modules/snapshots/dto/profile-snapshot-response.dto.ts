import { ApiProperty } from '@nestjs/swagger';

export class ProfileSnapshotResponseDto {
  @ApiProperty({ type: String })
  id!: string;

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

  @ApiProperty({ type: Number })
  totalPlaytimeMinutes!: number;

  @ApiProperty({ type: Number, nullable: true })
  rarestUnlockedGlobalPercentage!: number | null;

  @ApiProperty({ enum: ['manual', 'sync_completed', 'scheduled'] })
  snapshotReason!: string;

  @ApiProperty({ type: String })
  createdAt!: string;
}

export class ProfileSnapshotsResponseDto {
  @ApiProperty({ type: String })
  steamId!: string;

  @ApiProperty({ type: [ProfileSnapshotResponseDto] })
  items!: ProfileSnapshotResponseDto[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  limit!: number;

  @ApiProperty({ type: Number })
  offset!: number;
}
