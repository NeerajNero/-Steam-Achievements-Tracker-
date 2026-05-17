import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileMilestoneResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: String, example: 'completed_games_count' })
  milestoneType!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 10 })
  thresholdValue!: number | null;

  @ApiProperty({ type: String, example: '10 Completed Games' })
  title!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Reached 10 completed tracked Steam games.',
  })
  description!: string | null;

  @ApiProperty({ type: String, example: '2026-05-17T12:00:00.000Z' })
  achievedAt!: string;

  @ApiProperty({ type: Object, example: {} })
  metadata!: Record<string, unknown>;
}

export class ProfileMilestonesResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: [ProfileMilestoneResponseDto] })
  items!: ProfileMilestoneResponseDto[];

  @ApiProperty({ type: Number, example: 20 })
  total!: number;

  @ApiProperty({ type: Number, example: 20 })
  limit!: number;

  @ApiProperty({ type: Number, example: 0 })
  offset!: number;
}
