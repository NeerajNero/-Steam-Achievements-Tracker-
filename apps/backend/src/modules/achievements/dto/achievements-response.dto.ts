import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type AchievementUnlockState = 'unlocked' | 'locked' | 'unknown';

export class AchievementWithUnlockStateResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

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

  @ApiPropertyOptional({ type: Number, example: 4.321, nullable: true })
  globalPercentage!: number | null;

  @ApiProperty({ type: Boolean, example: false })
  hidden!: boolean;

  @ApiProperty({ type: Boolean, example: true })
  achieved!: boolean;

  @ApiProperty({
    enum: ['unlocked', 'locked', 'unknown'],
    example: 'unlocked',
    description:
      'unknown means achievement metadata exists but player unlock state has not been synced or is unavailable.',
  })
  unlockState!: AchievementUnlockState;

  @ApiPropertyOptional({
    type: String,
    example: '2026-05-15T12:00:00.000Z',
    nullable: true,
  })
  unlockedAt!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-05-16T05:07:30.710Z',
    nullable: true,
  })
  lastSyncedAt!: string | null;
}

export class AchievementsResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: Number, example: 910002 })
  steamAppId!: number;

  @ApiProperty({ type: Number, example: 8 })
  total!: number;

  @ApiProperty({ type: [AchievementWithUnlockStateResponseDto] })
  items!: AchievementWithUnlockStateResponseDto[];
}
