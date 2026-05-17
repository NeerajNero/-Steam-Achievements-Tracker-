import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CommunityService } from './community.service';
import { CreateContentReportDto } from './dto/community-request.dto';
import { ContentReportResponseDto } from './dto/community-response.dto';

@Controller()
@ApiTags('reports')
export class ReportsController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('reports')
  @UseGuards(SessionAuthGuard)
  @HttpCode(201)
  @ApiOperation({
    operationId: 'createContentReport',
    summary: 'Create a moderation intake report',
  })
  @ApiBody({ type: CreateContentReportDto })
  @ApiOkResponse({ type: ContentReportResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiNotFoundResponse({ description: 'Reported content was not found.' })
  createContentReport(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: CreateContentReportDto,
  ): Promise<ContentReportResponseDto> {
    return this.communityService.createContentReport(currentUser, body);
  }
}
