import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import {
  AchievementListQueryDto,
  AchievementSortDto,
  AchievementStatusDto,
} from './dto/achievement-list-query.dto';
import { AchievementsResponseDto } from './dto/achievements-response.dto';
import { RarestAchievementsResponseDto } from './dto/rarest-achievements-response.dto';
import { AchievementsService } from './achievements.service';
import { SortOrderDto } from '../games/dto/game-library-query.dto';
import { LimitQueryDto } from '../games/dto/limit-query.dto';

@Controller('profiles/:steamId')
@ApiTags('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('games/:steamAppId/achievements')
  @ApiOperation({
    operationId: 'listGameAchievements',
    summary: 'List stored achievements for a profile game',
    description:
      'Returns achievement metadata with profile unlock state from PostgreSQL only.',
  })
  @ApiParam({
    name: 'steamId',
    type: String,
    example: '76561198000000000',
    description: 'Steam 64-bit profile ID.',
  })
  @ApiParam({
    name: 'steamAppId',
    type: Number,
    example: 910002,
    description: 'Steam app ID.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AchievementStatusDto,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: AchievementSortDto,
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: SortOrderDto,
  })
  @ApiOkResponse({ type: AchievementsResponseDto })
  @ApiNotFoundResponse({
    description: 'Profile or profile game row has not been synced.',
  })
  getGameAchievements(
    @Param('steamId') steamId: string,
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
    @Query() query: AchievementListQueryDto,
  ): Promise<AchievementsResponseDto> {
    return this.achievementsService.getGameAchievements(
      steamId,
      steamAppId,
      query,
    );
  }

  @Get('achievements/rarest')
  @ApiOperation({
    operationId: 'listRarestAchievements',
    summary: 'List rarest unlocked achievements',
    description:
      'Returns unlocked achievements ordered by global rarity ascending and excludes null rarity values.',
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
  @ApiOkResponse({ type: RarestAchievementsResponseDto })
  @ApiNotFoundResponse({ description: 'Profile has not been synced.' })
  getRarestUnlockedAchievements(
    @Param('steamId') steamId: string,
    @Query() query: LimitQueryDto,
  ): Promise<RarestAchievementsResponseDto> {
    return this.achievementsService.getRarestUnlockedAchievements(steamId, query);
  }
}
