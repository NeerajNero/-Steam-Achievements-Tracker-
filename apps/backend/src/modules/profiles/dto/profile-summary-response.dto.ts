import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileSummaryResponseDto {
  @ApiProperty({
    type: String,
    example: '76561198000000000',
    description: 'Steam 64-bit profile ID.',
  })
  steamId!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Demo Achievement Hunter',
    nullable: true,
    description: 'Current Steam persona name, when visible.',
  })
  personaName!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: null,
    nullable: true,
    description: 'Steam avatar URL, when available.',
  })
  avatarUrl!: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 3,
    nullable: true,
    description: 'Steam visibility state returned by the Steam Web API.',
  })
  visibilityState!: number | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether the profile is private or unavailable for sync.',
  })
  isPrivate!: boolean;

  @ApiPropertyOptional({
    type: String,
    example: '2026-05-16T05:07:30.710Z',
    nullable: true,
    description: 'Last time this profile was synced from Steam.',
  })
  lastSyncedAt!: string | null;

  @ApiProperty({ type: Number, example: 6 })
  totalGames!: number;

  @ApiProperty({ type: Number, example: 1 })
  completedGames!: number;

  @ApiProperty({ type: Number, example: 41 })
  totalAchievements!: number;

  @ApiProperty({ type: Number, example: 24 })
  unlockedAchievements!: number;

  @ApiProperty({ type: Number, example: 17 })
  remainingAchievements!: number;

  @ApiProperty({
    type: Number,
    example: 58.54,
    description: 'Average completion percentage across profile games.',
  })
  averageCompletionPercentage!: number;
}
