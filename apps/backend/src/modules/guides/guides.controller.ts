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

import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { GuideListQueryDto } from './dto/guide-list-query.dto';
import {
  AddGuideAchievementsDto,
  CreateGuideDto,
  CreateGuideSectionDto,
  GuideStatusDto,
  UpdateGuideDto,
  UpdateGuideSectionDto,
} from './dto/guide-request.dto';
import {
  AccountGuidesResponseDto,
  AddGuideAchievementsResponseDto,
  GuideDetailResponseDto,
  GuideListResponseDto,
  GuideSectionResponseDto,
} from './dto/guide-response.dto';
import { GuidesService } from './guides.service';

@Controller()
@ApiTags('guides')
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  @Get('games/:steamAppId/guides')
  @ApiOperation({
    operationId: 'listGameGuides',
    summary: 'List public guides for a Steam game',
    description:
      'Returns published public guides for a tracked Steam game from PostgreSQL only.',
  })
  @ApiParam({ name: 'steamAppId', type: Number, example: 910001 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [GuideStatusDto.Published],
    description: 'Public guide lists return published guides only.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ type: GuideListResponseDto })
  @ApiNotFoundResponse({ description: 'Game has not been tracked.' })
  listGameGuides(
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
    @Query() query: GuideListQueryDto,
  ): Promise<GuideListResponseDto> {
    return this.guidesService.listGameGuides(steamAppId, query);
  }

  @Get('games/:steamAppId/guides/:slug')
  @ApiOperation({
    operationId: 'getGameGuide',
    summary: 'Get a public Steam game guide',
    description:
      'Returns one published public guide with sections and attached achievements.',
  })
  @ApiParam({ name: 'steamAppId', type: Number, example: 910001 })
  @ApiParam({ name: 'slug', type: String, example: '100-roadmap' })
  @ApiOkResponse({ type: GuideDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Game or guide was not found.' })
  getGameGuide(
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
    @Param('slug') slug: string,
  ): Promise<GuideDetailResponseDto> {
    return this.guidesService.getGameGuide(steamAppId, slug);
  }

  @Post('games/:steamAppId/guides')
  @UseGuards(SessionAuthGuard)
  @HttpCode(201)
  @ApiOperation({
    operationId: 'createGameGuide',
    summary: 'Create a draft guide for a Steam game',
  })
  @ApiParam({ name: 'steamAppId', type: Number, example: 910001 })
  @ApiBody({ type: CreateGuideDto })
  @ApiOkResponse({ type: GuideDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiNotFoundResponse({ description: 'Game has not been tracked.' })
  createGameGuide(
    @Param('steamAppId', ParseIntPipe) steamAppId: number,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: CreateGuideDto,
  ): Promise<GuideDetailResponseDto> {
    return this.guidesService.createGameGuide(steamAppId, currentUser, body);
  }

  @Patch('guides/:guideId')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'updateGuide',
    summary: 'Update a guide',
    description: 'Only the author, admin, or moderator can edit a guide.',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiBody({ type: UpdateGuideDto })
  @ApiOkResponse({ type: GuideDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot edit this guide.' })
  @ApiNotFoundResponse({ description: 'Guide was not found.' })
  updateGuide(
    @Param('guideId') guideId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpdateGuideDto,
  ): Promise<GuideDetailResponseDto> {
    return this.guidesService.updateGuide(guideId, currentUser, body);
  }

  @Get('account/guides')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'listAccountGuides',
    summary: 'List current user guides',
  })
  @ApiOkResponse({ type: AccountGuidesResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  listAccountGuides(
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<AccountGuidesResponseDto> {
    return this.guidesService.listAccountGuides(currentUser);
  }

  @Post('guides/:guideId/sections')
  @UseGuards(SessionAuthGuard)
  @HttpCode(201)
  @ApiOperation({
    operationId: 'createGuideSection',
    summary: 'Create a guide section',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiBody({ type: CreateGuideSectionDto })
  @ApiOkResponse({ type: GuideSectionResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot edit this guide.' })
  createGuideSection(
    @Param('guideId') guideId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: CreateGuideSectionDto,
  ): Promise<GuideSectionResponseDto> {
    return this.guidesService.createGuideSection(guideId, currentUser, body);
  }

  @Patch('guides/:guideId/sections/:sectionId')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'updateGuideSection',
    summary: 'Update a guide section',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiParam({ name: 'sectionId', type: String })
  @ApiBody({ type: UpdateGuideSectionDto })
  @ApiOkResponse({ type: GuideSectionResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot edit this guide.' })
  updateGuideSection(
    @Param('guideId') guideId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpdateGuideSectionDto,
  ): Promise<GuideSectionResponseDto> {
    return this.guidesService.updateGuideSection(
      guideId,
      sectionId,
      currentUser,
      body,
    );
  }

  @Post('guides/:guideId/achievements')
  @UseGuards(SessionAuthGuard)
  @HttpCode(201)
  @ApiOperation({
    operationId: 'addGuideAchievements',
    summary: 'Attach achievements to a guide',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiBody({ type: AddGuideAchievementsDto })
  @ApiOkResponse({ type: AddGuideAchievementsResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot edit this guide.' })
  addGuideAchievements(
    @Param('guideId') guideId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: AddGuideAchievementsDto,
  ): Promise<AddGuideAchievementsResponseDto> {
    return this.guidesService.addGuideAchievements(guideId, currentUser, body);
  }

  @Delete('guides/:guideId/achievements/:achievementId')
  @UseGuards(SessionAuthGuard)
  @HttpCode(204)
  @ApiOperation({
    operationId: 'removeGuideAchievement',
    summary: 'Detach an achievement from a guide',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiParam({ name: 'achievementId', type: String })
  @ApiNoContentResponse({ description: 'Achievement mapping removed.' })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot edit this guide.' })
  removeGuideAchievement(
    @Param('guideId') guideId: string,
    @Param('achievementId') achievementId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    return this.guidesService.removeGuideAchievement(
      guideId,
      achievementId,
      currentUser,
    );
  }
}
