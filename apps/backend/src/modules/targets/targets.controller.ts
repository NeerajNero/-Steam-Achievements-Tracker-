import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import {
  CreateAchievementTargetDto,
  CreateGameTargetDto,
  ListAccountTargetsQueryDto,
  TargetStatusDto,
  TargetTypeDto,
  UpdateAchievementTargetDto,
  UpdateGameTargetDto,
} from './dto/target-request.dto';
import {
  AccountTargetResponseDto,
  AccountTargetsResponseDto,
} from './dto/target-response.dto';
import { TargetsService } from './targets.service';

@Controller('account/targets')
@ApiTags('targets')
@UseGuards(SessionAuthGuard)
@ApiUnauthorizedResponse({ description: 'Authentication is required.' })
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

  @Get()
  @ApiOperation({
    operationId: 'listAccountTargets',
    summary: 'List signed-in user completion targets',
  })
  @ApiQuery({ name: 'status', required: false, enum: TargetStatusDto })
  @ApiQuery({ name: 'type', required: false, enum: TargetTypeDto })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: AccountTargetsResponseDto })
  listAccountTargets(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Query() query: ListAccountTargetsQueryDto,
  ): Promise<AccountTargetsResponseDto> {
    return this.targetsService.listAccountTargets(currentUser, query);
  }

  @Post('games')
  @ApiOperation({
    operationId: 'createGameTarget',
    summary: 'Create or reactivate a signed-in user game target',
  })
  @ApiOkResponse({ type: AccountTargetResponseDto })
  @ApiBody({ type: CreateGameTargetDto })
  @ApiBadRequestResponse({ description: 'A linked Steam profile is required.' })
  @ApiNotFoundResponse({ description: 'Game is unknown.' })
  createGameTarget(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: CreateGameTargetDto,
  ): Promise<AccountTargetResponseDto> {
    return this.targetsService.createGameTarget(currentUser, body);
  }

  @Patch('games/:targetId')
  @ApiOperation({
    operationId: 'updateGameTarget',
    summary: 'Update a signed-in user game target',
  })
  @ApiParam({ name: 'targetId', type: String })
  @ApiBody({ type: UpdateGameTargetDto })
  @ApiOkResponse({ type: AccountTargetResponseDto })
  @ApiNotFoundResponse({ description: 'Target is missing or belongs to another user.' })
  updateGameTarget(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Param('targetId') targetId: string,
    @Body() body: UpdateGameTargetDto,
  ): Promise<AccountTargetResponseDto> {
    return this.targetsService.updateGameTarget(currentUser, targetId, body);
  }

  @Delete('games/:targetId')
  @ApiOperation({
    operationId: 'archiveGameTarget',
    summary: 'Archive a signed-in user game target',
  })
  @ApiParam({ name: 'targetId', type: String })
  @ApiOkResponse({ type: AccountTargetResponseDto })
  @ApiNotFoundResponse({ description: 'Target is missing or belongs to another user.' })
  archiveGameTarget(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Param('targetId') targetId: string,
  ): Promise<AccountTargetResponseDto> {
    return this.targetsService.archiveGameTarget(currentUser, targetId);
  }

  @Post('achievements')
  @ApiOperation({
    operationId: 'createAchievementTarget',
    summary: 'Create or reactivate a signed-in user achievement target',
  })
  @ApiOkResponse({ type: AccountTargetResponseDto })
  @ApiBody({ type: CreateAchievementTargetDto })
  @ApiBadRequestResponse({ description: 'A linked Steam profile is required.' })
  @ApiNotFoundResponse({ description: 'Achievement is unknown.' })
  createAchievementTarget(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: CreateAchievementTargetDto,
  ): Promise<AccountTargetResponseDto> {
    return this.targetsService.createAchievementTarget(currentUser, body);
  }

  @Patch('achievements/:targetId')
  @ApiOperation({
    operationId: 'updateAchievementTarget',
    summary: 'Update a signed-in user achievement target',
  })
  @ApiParam({ name: 'targetId', type: String })
  @ApiBody({ type: UpdateAchievementTargetDto })
  @ApiOkResponse({ type: AccountTargetResponseDto })
  @ApiNotFoundResponse({ description: 'Target is missing or belongs to another user.' })
  updateAchievementTarget(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Param('targetId') targetId: string,
    @Body() body: UpdateAchievementTargetDto,
  ): Promise<AccountTargetResponseDto> {
    return this.targetsService.updateAchievementTarget(currentUser, targetId, body);
  }

  @Delete('achievements/:targetId')
  @ApiOperation({
    operationId: 'archiveAchievementTarget',
    summary: 'Archive a signed-in user achievement target',
  })
  @ApiParam({ name: 'targetId', type: String })
  @ApiOkResponse({ type: AccountTargetResponseDto })
  @ApiNotFoundResponse({ description: 'Target is missing or belongs to another user.' })
  archiveAchievementTarget(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Param('targetId') targetId: string,
  ): Promise<AccountTargetResponseDto> {
    return this.targetsService.archiveAchievementTarget(currentUser, targetId);
  }
}
