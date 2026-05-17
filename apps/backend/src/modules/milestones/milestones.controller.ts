import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { SyncSteamIdParamDto } from '../sync/dto/sync-steam-id-param.dto';
import { MilestoneQueryDto } from './dto/milestone-query.dto';
import { ProfileMilestonesResponseDto } from './dto/milestone-response.dto';
import { MilestonesService } from './milestones.service';

@ApiTags('milestones')
@Controller('profiles/:steamId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  @ApiOperation({
    operationId: 'listProfileMilestones',
    summary: 'List profile milestones',
  })
  @ApiParam({ name: 'steamId', description: 'Steam 64-bit profile id' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: ProfileMilestonesResponseDto })
  @ApiNotFoundResponse({ description: 'Profile was not found.' })
  listProfileMilestones(
    @Param() params: SyncSteamIdParamDto,
    @Query() query: MilestoneQueryDto,
  ): Promise<ProfileMilestonesResponseDto> {
    return this.milestonesService.listProfileMilestones(params.steamId, query);
  }
}
