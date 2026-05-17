import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { SyncSteamIdParamDto } from '../sync/dto/sync-steam-id-param.dto';
import { ActivityService } from './activity.service';
import {
  ActivityEventTypeDto,
  ActivityQueryDto,
  GameActivityQueryDto,
} from './dto/activity-query.dto';
import { ActivityFeedResponseDto } from './dto/activity-response.dto';

@ApiTags('activity')
@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('activity')
  @ApiOperation({
    operationId: 'listActivity',
    summary: 'List latest public activity events',
  })
  @ApiQuery({ name: 'eventType', required: false, enum: ActivityEventTypeDto })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: ActivityFeedResponseDto })
  listActivity(
    @Query() query: ActivityQueryDto,
  ): Promise<ActivityFeedResponseDto> {
    return this.activityService.listActivity(query);
  }

  @Get('profiles/:steamId/activity')
  @ApiOperation({
    operationId: 'listProfileActivity',
    summary: 'List public activity for a Steam profile',
  })
  @ApiParam({ name: 'steamId', description: 'Steam 64-bit profile id' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: ActivityFeedResponseDto })
  @ApiNotFoundResponse({ description: 'Profile was not found.' })
  listProfileActivity(
    @Param() params: SyncSteamIdParamDto,
    @Query() query: GameActivityQueryDto,
  ): Promise<ActivityFeedResponseDto> {
    return this.activityService.listProfileActivity(params.steamId, query);
  }

  @Get('games/:steamAppId/activity')
  @ApiOperation({
    operationId: 'listGameActivity',
    summary: 'List public activity for a Steam game',
  })
  @ApiParam({ name: 'steamAppId', type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: ActivityFeedResponseDto })
  @ApiNotFoundResponse({ description: 'Game was not found.' })
  listGameActivity(
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
    @Query() query: GameActivityQueryDto,
  ): Promise<ActivityFeedResponseDto> {
    return this.activityService.listGameActivity(steamAppId, query);
  }
}
