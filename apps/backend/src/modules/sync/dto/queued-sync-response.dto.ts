import { ApiProperty } from '@nestjs/swagger';

import { SyncScopeDto, type SyncScope } from './sync-request.dto';

export enum QueuedSyncStatusDto {
  Queued = 'queued',
}

export class QueuedSyncResponseDto {
  @ApiProperty({
    type: String,
    example: 'e0cfb455-5fac-4cdf-9634-25a3404585a8',
    description: 'PostgreSQL sync_runs ID used for polling status.',
  })
  syncRunId!: string;

  @ApiProperty({
    type: String,
    example:
      'steam-sync-76561198000000000-achievements-e0cfb455-5fac-4cdf-9634-25a3404585a8',
    description: 'BullMQ job ID for operational debugging.',
  })
  jobId!: string;

  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ enum: SyncScopeDto, example: SyncScopeDto.Achievements })
  scope!: SyncScope;

  @ApiProperty({
    enum: QueuedSyncStatusDto,
    example: QueuedSyncStatusDto.Queued,
  })
  status!: 'queued';

  @ApiProperty({ type: String, example: '2026-05-16T05:07:30.710Z' })
  queuedAt!: string;
}
