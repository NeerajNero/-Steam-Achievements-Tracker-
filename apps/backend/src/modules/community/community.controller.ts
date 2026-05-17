import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
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
import { CommunityService } from './community.service';
import {
  CreateCommentDto,
  UpsertGuideVoteDto,
  UpdateCommentDto,
} from './dto/community-request.dto';
import {
  CommentListResponseDto,
  CommentResponseDto,
  GuideVoteSummaryResponseDto,
} from './dto/community-response.dto';

@Controller()
@ApiTags('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('guides/:guideId/votes/summary')
  @UseGuards(OptionalSessionAuthGuard)
  @ApiOperation({
    operationId: 'getGuideVoteSummary',
    summary: 'Get guide vote summary',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiOkResponse({ type: GuideVoteSummaryResponseDto })
  @ApiNotFoundResponse({ description: 'Guide was not found.' })
  getGuideVoteSummary(
    @Param('guideId') guideId: string,
    @Req() request: Request & RequestWithAuthenticatedUser,
  ): Promise<GuideVoteSummaryResponseDto> {
    return this.communityService.getGuideVoteSummary(
      guideId,
      request.authenticatedUser,
    );
  }

  @Put('guides/:guideId/vote')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'upsertGuideVote',
    summary: 'Create or update current user guide vote',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiBody({ type: UpsertGuideVoteDto })
  @ApiOkResponse({ type: GuideVoteSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiNotFoundResponse({ description: 'Guide was not found.' })
  upsertGuideVote(
    @Param('guideId') guideId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpsertGuideVoteDto,
  ): Promise<GuideVoteSummaryResponseDto> {
    return this.communityService.upsertGuideVote(guideId, currentUser, body);
  }

  @Delete('guides/:guideId/vote')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'removeGuideVote',
    summary: 'Remove current user guide vote',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiOkResponse({ type: GuideVoteSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiNotFoundResponse({ description: 'Guide was not found.' })
  removeGuideVote(
    @Param('guideId') guideId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<GuideVoteSummaryResponseDto> {
    return this.communityService.removeGuideVote(guideId, currentUser);
  }

  @Get('guides/:guideId/comments')
  @ApiOperation({
    operationId: 'listGuideComments',
    summary: 'List visible guide comments',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiOkResponse({ type: CommentListResponseDto })
  @ApiNotFoundResponse({ description: 'Guide was not found.' })
  listGuideComments(
    @Param('guideId') guideId: string,
  ): Promise<CommentListResponseDto> {
    return this.communityService.listGuideComments(guideId);
  }

  @Post('guides/:guideId/comments')
  @UseGuards(SessionAuthGuard)
  @HttpCode(201)
  @ApiOperation({
    operationId: 'createGuideComment',
    summary: 'Create a guide comment',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiBody({ type: CreateCommentDto })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  createGuideComment(
    @Param('guideId') guideId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.communityService.createGuideComment(guideId, currentUser, body);
  }

  @Patch('guides/:guideId/comments/:commentId')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'updateGuideComment',
    summary: 'Update a guide comment',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiParam({ name: 'commentId', type: String })
  @ApiBody({ type: UpdateCommentDto })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot manage this comment.' })
  updateGuideComment(
    @Param('guideId') guideId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.communityService.updateGuideComment(
      guideId,
      commentId,
      currentUser,
      body,
    );
  }

  @Delete('guides/:guideId/comments/:commentId')
  @UseGuards(SessionAuthGuard)
  @HttpCode(204)
  @ApiOperation({
    operationId: 'deleteGuideComment',
    summary: 'Soft-delete a guide comment',
  })
  @ApiParam({ name: 'guideId', type: String })
  @ApiParam({ name: 'commentId', type: String })
  @ApiNoContentResponse({ description: 'Comment deleted.' })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot manage this comment.' })
  deleteGuideComment(
    @Param('guideId') guideId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    return this.communityService.deleteGuideComment(
      guideId,
      commentId,
      currentUser,
    );
  }

  @Get('sessions/:sessionId/comments')
  @UseGuards(OptionalSessionAuthGuard)
  @ApiOperation({
    operationId: 'listSessionComments',
    summary: 'List visible session comments',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ type: CommentListResponseDto })
  @ApiNotFoundResponse({ description: 'Session was not found or is private.' })
  listSessionComments(
    @Param('sessionId') sessionId: string,
    @Req() request: Request & RequestWithAuthenticatedUser,
  ): Promise<CommentListResponseDto> {
    return this.communityService.listSessionComments(
      sessionId,
      request.authenticatedUser,
    );
  }

  @Post('sessions/:sessionId/comments')
  @UseGuards(SessionAuthGuard)
  @HttpCode(201)
  @ApiOperation({
    operationId: 'createSessionComment',
    summary: 'Create a session comment',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiBody({ type: CreateCommentDto })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  createSessionComment(
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.communityService.createSessionComment(
      sessionId,
      currentUser,
      body,
    );
  }

  @Patch('sessions/:sessionId/comments/:commentId')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'updateSessionComment',
    summary: 'Update a session comment',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiParam({ name: 'commentId', type: String })
  @ApiBody({ type: UpdateCommentDto })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot manage this comment.' })
  updateSessionComment(
    @Param('sessionId') sessionId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.communityService.updateSessionComment(
      sessionId,
      commentId,
      currentUser,
      body,
    );
  }

  @Delete('sessions/:sessionId/comments/:commentId')
  @UseGuards(SessionAuthGuard)
  @HttpCode(204)
  @ApiOperation({
    operationId: 'deleteSessionComment',
    summary: 'Soft-delete a session comment',
  })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiParam({ name: 'commentId', type: String })
  @ApiNoContentResponse({ description: 'Comment deleted.' })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({ description: 'User cannot manage this comment.' })
  deleteSessionComment(
    @Param('sessionId') sessionId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    return this.communityService.deleteSessionComment(
      sessionId,
      commentId,
      currentUser,
    );
  }
}
