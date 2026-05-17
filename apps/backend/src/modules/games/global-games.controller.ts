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
  GlobalGameAchievementsQueryDto,
  GlobalGameAchievementHiddenDto,
  GlobalGameAchievementSortDto,
} from './dto/global-game-achievements-query.dto';
import {
  GlobalGamePlayersQueryDto,
  GlobalGamePlayerSortDto,
  GlobalGamePlayerStatusDto,
} from './dto/global-game-players-query.dto';
import {
  GlobalGameQueryDto,
  GlobalGameSortDto,
} from './dto/global-game-query.dto';
import {
  GlobalGameAchievementsResponseDto,
  GlobalGameDetailResponseDto,
  GlobalGamePlayersResponseDto,
  GlobalGamesResponseDto,
} from './dto/global-game-response.dto';
import { SortOrderDto } from './dto/game-library-query.dto';
import { GamesService } from './games.service';

@Controller('games')
@ApiTags('games')
export class GlobalGamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({
    operationId: 'listGlobalGames',
    summary: 'List tracked Steam games',
    description:
      'Returns global game rows and aggregate tracked-player stats from PostgreSQL only.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'hasAchievements', required: false, type: Boolean })
  @ApiQuery({ name: 'sort', required: false, enum: GlobalGameSortDto })
  @ApiQuery({ name: 'order', required: false, enum: SortOrderDto })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: GlobalGamesResponseDto })
  listGames(@Query() query: GlobalGameQueryDto): Promise<GlobalGamesResponseDto> {
    return this.gamesService.getGlobalGames(query);
  }

  @Get(':steamAppId')
  @ApiOperation({
    operationId: 'getGlobalGame',
    summary: 'Get global Steam game detail',
    description:
      'Returns canonical game metadata and aggregate tracked-player stats from PostgreSQL only.',
  })
  @ApiParam({ name: 'steamAppId', type: Number, example: 910001 })
  @ApiOkResponse({ type: GlobalGameDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Game has not been tracked.' })
  getGame(
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
  ): Promise<GlobalGameDetailResponseDto> {
    return this.gamesService.getGlobalGame(steamAppId);
  }

  @Get(':steamAppId/achievements')
  @ApiOperation({
    operationId: 'listGlobalGameAchievements',
    summary: 'List global game achievement metadata',
    description:
      'Returns canonical achievement metadata for one tracked game from PostgreSQL only.',
  })
  @ApiParam({ name: 'steamAppId', type: Number, example: 910001 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'hidden',
    required: false,
    enum: GlobalGameAchievementHiddenDto,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: GlobalGameAchievementSortDto,
  })
  @ApiQuery({ name: 'order', required: false, enum: SortOrderDto })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: GlobalGameAchievementsResponseDto })
  @ApiNotFoundResponse({ description: 'Game has not been tracked.' })
  listGameAchievements(
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
    @Query() query: GlobalGameAchievementsQueryDto,
  ): Promise<GlobalGameAchievementsResponseDto> {
    return this.gamesService.getGlobalGameAchievements(steamAppId, query);
  }

  @Get(':steamAppId/players')
  @ApiOperation({
    operationId: 'listGlobalGamePlayers',
    summary: 'List tracked players for a game',
    description:
      'Returns public Steam profile metadata and progress for tracked players from PostgreSQL only.',
  })
  @ApiParam({ name: 'steamAppId', type: Number, example: 910001 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: GlobalGamePlayerStatusDto,
  })
  @ApiQuery({ name: 'sort', required: false, enum: GlobalGamePlayerSortDto })
  @ApiQuery({ name: 'order', required: false, enum: SortOrderDto })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: GlobalGamePlayersResponseDto })
  @ApiNotFoundResponse({ description: 'Game has not been tracked.' })
  listGamePlayers(
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
    @Query() query: GlobalGamePlayersQueryDto,
  ): Promise<GlobalGamePlayersResponseDto> {
    return this.gamesService.getGlobalGamePlayers(steamAppId, query);
  }
}
