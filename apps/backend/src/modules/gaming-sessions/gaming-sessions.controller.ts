import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import type {
  AuthenticatedUserContext,
  RequestWithAuthenticatedUser,
} from '../auth/authenticated-user.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalSessionAuthGuard } from '../auth/optional-session-auth.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  AddSessionAchievementsDto,
  CreateGamingSessionDto,
  UpdateGamingSessionDto,
} from './dto/gaming-session-request.dto';
import {
  GlobalSessionListQueryDto,
  SessionListQueryDto,
} from './dto/gaming-session-query.dto';
import {
  AddSessionAchievementsResponseDto,
  GamingSessionDetailResponseDto,
  GamingSessionListResponseDto,
} from './dto/gaming-session-response.dto';
import { GamingSessionsService } from './gaming-sessions.service';

@Controller()
@ApiTags('sessions')
export class GamingSessionsController {
  constructor(private readonly gamingSessionsService: GamingSessionsService) {}

  @Get('sessions')
  @ApiOperation({
    operationId: 'listGlobalSessions',
    summary: 'List public upcoming Steam game sessions',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'full', 'completed', 'cancelled'] })
  @ApiQuery({ name: 'steamAppId', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: GamingSessionListResponseDto })
  listGlobalSessions(
    @Query() query: GlobalSessionListQueryDto,
  ): Promise<GamingSessionListResponseDto> {
    return this.gamingSessionsService.listGlobalSessions(query);
  }

  @Get('games/:steamAppId/sessions')
  @ApiOperation({
    operationId: 'listGameSessions',
    summary: 'List public sessions for a Steam game',
  })
  @ApiParam({ name: 'steamAppId', type: Number, example: 910001 })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'full', 'completed', 'cancelled'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: GamingSessionListResponseDto })
  @ApiNotFoundResponse({ description: 'Game has not been tracked.' })
  listGameSessions(
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
    @Query() query: SessionListQueryDto,
  ): Promise<GamingSessionListResponseDto> {
    return this.gamingSessionsService.listGameSessions(steamAppId, query);
  }

  @Get('sessions/:sessionId')
  @UseGuards(OptionalSessionAuthGuard)
  @ApiOperation({
    operationId: 'getSession',
    summary: 'Get a Steam game session',
    description:
      'Returns public session details, or private/unlisted details to the host or joined participants.',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ type: GamingSessionDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Session was not found or is private.' })
  getSession(
    @Param('sessionId') sessionId: string,
    @Req() request: Request & RequestWithAuthenticatedUser,
  ): Promise<GamingSessionDetailResponseDto> {
    return this.gamingSessionsService.getSession(
      sessionId,
      request.authenticatedUser,
    );
  }

  @Post('games/:steamAppId/sessions')
  @UseGuards(SessionAuthGuard)
  @HttpCode(201)
  @ApiOperation({
    operationId: 'createGameSession',
    summary: 'Create a scheduled Steam game session',
  })
  @ApiParam({ name: 'steamAppId', type: Number, example: 910001 })
  @ApiBody({ type: CreateGamingSessionDto })
  @ApiOkResponse({ type: GamingSessionDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiNotFoundResponse({ description: 'Game has not been tracked.' })
  createGameSession(
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: CreateGamingSessionDto,
  ): Promise<GamingSessionDetailResponseDto> {
    return this.gamingSessionsService.createGameSession(
      steamAppId,
      currentUser,
      body,
    );
  }

  @Patch('sessions/:sessionId')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'updateSession',
    summary: 'Update a Steam game session',
    description: 'Only the host, admin, or moderator can update a session.',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiBody({ type: UpdateGamingSessionDto })
  @ApiOkResponse({ type: GamingSessionDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot manage this session.' })
  @ApiNotFoundResponse({ description: 'Session was not found.' })
  updateSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpdateGamingSessionDto,
  ): Promise<GamingSessionDetailResponseDto> {
    return this.gamingSessionsService.updateSession(
      sessionId,
      currentUser,
      body,
    );
  }

  @Post('sessions/:sessionId/join')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'joinSession',
    summary: 'Join an open Steam game session',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ type: GamingSessionDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiNotFoundResponse({ description: 'Session was not found.' })
  joinSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<GamingSessionDetailResponseDto> {
    return this.gamingSessionsService.joinSession(sessionId, currentUser);
  }

  @Post('sessions/:sessionId/leave')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'leaveSession',
    summary: 'Leave a Steam game session',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ type: GamingSessionDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiNotFoundResponse({ description: 'Session was not found.' })
  leaveSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<GamingSessionDetailResponseDto> {
    return this.gamingSessionsService.leaveSession(sessionId, currentUser);
  }

  @Post('sessions/:sessionId/cancel')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'cancelSession',
    summary: 'Cancel a Steam game session',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ type: GamingSessionDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot manage this session.' })
  cancelSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<GamingSessionDetailResponseDto> {
    return this.gamingSessionsService.cancelSession(sessionId, currentUser);
  }

  @Post('sessions/:sessionId/achievements')
  @UseGuards(SessionAuthGuard)
  @HttpCode(201)
  @ApiOperation({
    operationId: 'addSessionAchievements',
    summary: 'Attach achievements to a Steam game session',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiBody({ type: AddSessionAchievementsDto })
  @ApiOkResponse({ type: AddSessionAchievementsResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot manage this session.' })
  addSessionAchievements(
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: AddSessionAchievementsDto,
  ): Promise<AddSessionAchievementsResponseDto> {
    return this.gamingSessionsService.addSessionAchievements(
      sessionId,
      currentUser,
      body,
    );
  }

  @Delete('sessions/:sessionId/achievements/:achievementId')
  @UseGuards(SessionAuthGuard)
  @HttpCode(204)
  @ApiOperation({
    operationId: 'removeSessionAchievement',
    summary: 'Detach an achievement from a Steam game session',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiParam({ name: 'achievementId', type: String })
  @ApiNoContentResponse({ description: 'Achievement mapping removed.' })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot manage this session.' })
  removeSessionAchievement(
    @Param('sessionId') sessionId: string,
    @Param('achievementId') achievementId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    return this.gamingSessionsService.removeSessionAchievement(
      sessionId,
      achievementId,
      currentUser,
    );
  }
}
