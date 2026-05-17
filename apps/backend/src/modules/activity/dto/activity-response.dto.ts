import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ActivityEventTypeDto } from './activity-query.dto';

export class ActivityActorResponseDto {
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Steam Hunter' })
  displayName!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '76561198000000000',
  })
  steamId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'nero' })
  publicSlug!: string | null;
}

export class ActivitySteamProfileResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Steam Hunter' })
  personaName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  avatarUrl!: string | null;
}

export class ActivityEventResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ enum: ActivityEventTypeDto, example: ActivityEventTypeDto.GuidePublished })
  eventType!: string;

  @ApiProperty({ type: String, example: '2026-05-17T12:00:00.000Z' })
  occurredAt!: string;

  @ApiPropertyOptional({ type: ActivityActorResponseDto, nullable: true })
  actor!: ActivityActorResponseDto | null;

  @ApiPropertyOptional({ type: ActivitySteamProfileResponseDto, nullable: true })
  steamProfile!: ActivitySteamProfileResponseDto | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 910001 })
  steamAppId!: number | null;

  @ApiProperty({ type: String, example: 'guide' })
  entityType!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95',
  })
  entityId!: string | null;

  @ApiProperty({ type: Object, example: { title: 'Demo Roadmap' } })
  metadata!: Record<string, unknown>;
}

export class ActivityFeedResponseDto {
  @ApiProperty({ type: [ActivityEventResponseDto] })
  items!: ActivityEventResponseDto[];

  @ApiProperty({ type: Number, example: 30 })
  total!: number;

  @ApiProperty({ type: Number, example: 30 })
  limit!: number;

  @ApiProperty({ type: Number, example: 0 })
  offset!: number;
}
