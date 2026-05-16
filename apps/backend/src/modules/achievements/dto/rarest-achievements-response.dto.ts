import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RarestAchievementResponseDto {
  @ApiProperty({ type: Number, example: 910002 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'ACH_RARE_FIND' })
  apiName!: string;

  @ApiPropertyOptional({ type: String, example: 'Rare Find', nullable: true })
  displayName!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Unlock a rare achievement.',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  iconUrl!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  iconGrayUrl!: string | null;

  @ApiProperty({ type: Number, example: 1.234 })
  globalPercentage!: number;

  @ApiProperty({ type: Boolean, example: true })
  hidden!: boolean;

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

export class RarestAchievementsResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: [RarestAchievementResponseDto] })
  items!: RarestAchievementResponseDto[];
}
