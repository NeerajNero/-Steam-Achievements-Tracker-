import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { GameDetailResponseDto } from './dto/game-detail-response.dto';
import {
  GameLibraryQueryDto,
  GameLibrarySortDto,
  GameLibraryStatusDto,
  SortOrderDto,
} from './dto/game-library-query.dto';
import {
  GameLibraryResponseDto,
  NearestCompletionsResponseDto,
} from './dto/game-library-response.dto';
import { LimitQueryDto } from './dto/limit-query.dto';
import { GamesService } from './games.service';

@Controller('profiles/:steamId/games')
@ApiTags('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({
    operationId: 'listProfileGames',
    summary: 'List stored games for a profile',
    description:
      'Returns a paginated profile game library from PostgreSQL. Default sort is completion desc.',
  })
  @ApiParam({
    name: 'steamId',
    type: String,
    example: '76561198000000000',
    description: 'Steam 64-bit profile ID.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Case-insensitive game name search.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: GameLibraryStatusDto,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: GameLibrarySortDto,
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: SortOrderDto,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Integer from 1 to 100. Default 50.',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Non-negative integer. Default 0.',
  })
  @ApiOkResponse({ type: GameLibraryResponseDto })
  @ApiNotFoundResponse({ description: 'Profile has not been synced.' })
  getLibrary(
    @Param('steamId') steamId: string,
    @Query() query: GameLibraryQueryDto,
  ): Promise<GameLibraryResponseDto> {
    return this.gamesService.getLibrary(steamId, query);
  }

  @Get('nearest-completions')
  @ApiOperation({
    operationId: 'listNearestCompletions',
    summary: 'List nearest 100% completion candidates',
    description:
      'Excludes completed games and zero-achievement games while preserving zero-unlocked games with achievements.',
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
  @ApiOkResponse({ type: NearestCompletionsResponseDto })
  @ApiNotFoundResponse({ description: 'Profile has not been synced.' })
  getNearestCompletions(
    @Param('steamId') steamId: string,
    @Query() query: LimitQueryDto,
  ): Promise<NearestCompletionsResponseDto> {
    return this.gamesService.getNearestCompletions(steamId, query);
  }

  @Get(':steamAppId')
  @ApiOperation({
    operationId: 'getProfileGame',
    summary: 'Get one stored profile game detail',
    description: 'Returns game metadata, profile progress, and summary counts.',
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
  @ApiOkResponse({ type: GameDetailResponseDto })
  @ApiNotFoundResponse({
    description: 'Profile or profile game row has not been synced.',
  })
  getGameDetail(
    @Param('steamId') steamId: string,
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
  ): Promise<GameDetailResponseDto> {
    return this.gamesService.getGameDetail(steamId, steamAppId);
  }
}
