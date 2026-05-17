import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import {
  LeaderboardResponseDto,
  LeaderboardsResponseDto,
} from './dto/leaderboard-response.dto';
import { LeaderboardsService } from './leaderboards.service';

@ApiTags('leaderboards')
@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Get()
  @ApiOperation({
    operationId: 'listLeaderboards',
    summary: 'List available leaderboards',
  })
  @ApiResponse({ status: 200, type: LeaderboardsResponseDto })
  listLeaderboards(): LeaderboardsResponseDto {
    return this.leaderboardsService.listLeaderboards();
  }

  @Get(':type')
  @ApiOperation({
    operationId: 'getLeaderboard',
    summary: 'Get a leaderboard from latest profile snapshots',
  })
  @ApiParam({
    name: 'type',
    enum: [
      'completion_percentage',
      'completed_games',
      'unlocked_achievements',
      'rarest_unlocks',
    ],
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, type: LeaderboardResponseDto })
  @ApiResponse({ status: 404, description: 'Leaderboard type was not found' })
  getLeaderboard(
    @Param('type') type: string,
    @Query() query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardsService.getLeaderboard(type, query);
  }
}
