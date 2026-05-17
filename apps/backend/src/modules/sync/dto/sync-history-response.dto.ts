import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { SyncRunMetadata } from '../../../db/schema';

export enum SyncRunTypeDto {
  Profile = 'profile',
  Games = 'games',
  Achievements = 'achievements',
  Full = 'full',
}

export enum SyncRunStatusDto {
  Queued = 'queued',
  Running = 'running',
  Success = 'success',
  PartialSuccess = 'partial_success',
  Failed = 'failed',
}

export class SyncHistoryItemResponseDto {
  @ApiProperty({
    type: String,
    example: 'e0cfb455-5fac-4cdf-9634-25a3404585a8',
  })
  id!: string;

  @ApiProperty({ enum: SyncRunTypeDto, example: SyncRunTypeDto.Profile })
  syncType!: string;

  @ApiProperty({ enum: SyncRunStatusDto, example: SyncRunStatusDto.Success })
  status!: string;

  @ApiProperty({ type: String, example: '2026-05-16T05:07:30.710Z' })
  startedAt!: string;

  @ApiPropertyOptional({
    type: String,
    example: '2026-05-16T05:07:33.883Z',
    nullable: true,
  })
  finishedAt!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'STEAM_API_KEY is not configured in backend runtime environment.',
    nullable: true,
  })
  errorMessage!: string | null;

  @ApiProperty({
    type: Object,
    example: { scope: 'profile', steamId: '76561198000000000' },
  })
  metadata!: SyncRunMetadata;

  @ApiProperty({ type: String, example: '2026-05-16T05:07:30.710Z' })
  createdAt!: string;
}

export class SyncHistoryResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: [SyncHistoryItemResponseDto] })
  items!: SyncHistoryItemResponseDto[];
}
