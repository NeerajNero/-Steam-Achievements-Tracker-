import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { LimitQueryDto } from '../games/dto/limit-query.dto';
import { QueuedSyncResponseDto } from './dto/queued-sync-response.dto';
import { SyncRequestDto } from './dto/sync-request.dto';
import { SyncHistoryResponseDto } from './dto/sync-history-response.dto';
import { SyncSteamIdParamDto } from './dto/sync-steam-id-param.dto';
import { SyncService } from './sync.service';

@Controller('profiles/:steamId')
@ApiTags('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    operationId: 'enqueueProfileSync',
    summary: 'Queue a profile, owned-games, or achievement sync job',
    description:
      'Creates a queued sync_runs row and enqueues BullMQ work. Achievement sync can target all stored profile games or selected app IDs.',
  })
  @ApiParam({
    name: 'steamId',
    type: String,
    example: '76561198000000000',
    description: 'Steam 64-bit profile ID.',
  })
  @ApiBody({ type: SyncRequestDto })
  @ApiAcceptedResponse({ type: QueuedSyncResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid Steam ID or sync scope.' })
  syncProfile(
    @Param() params: SyncSteamIdParamDto,
    @Body() body: SyncRequestDto,
  ): Promise<QueuedSyncResponseDto> {
    return this.syncService.syncByScope(params.steamId, body);
  }

  @Get('sync-runs')
  @ApiOperation({
    operationId: 'listSyncRuns',
    summary: 'List recent sync runs for a profile',
    description:
      'Returns newest-first sync status history from PostgreSQL. Use this endpoint to poll queued sync progress.',
  })
  @ApiParam({
    name: 'steamId',
    type: String,
    example: '76561198000000000',
    description: 'Steam 64-bit profile ID.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Integer from 1 to 100. Default 10.',
  })
  @ApiOkResponse({ type: SyncHistoryResponseDto })
  @ApiNotFoundResponse({ description: 'Profile has not been synced.' })
  getSyncRuns(
    @Param('steamId') steamId: string,
    @Query() query: LimitQueryDto,
  ): Promise<SyncHistoryResponseDto> {
    return this.syncService.getSyncRuns(steamId, query);
  }
}
