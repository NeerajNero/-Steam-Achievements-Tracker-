import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { SyncSteamIdParamDto } from '../sync/dto/sync-steam-id-param.dto';
import { UpdateAccountShowcaseDto as UpdateAccountShowcaseBodyDto } from './dto/update-account-showcase.dto';
import {
  AccountShowcaseResponseDto,
  ProfileShowcaseResponseDto,
} from './dto/showcase-response.dto';
import { ShowcaseService } from './showcase.service';

@ApiTags('showcase')
@Controller()
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  @Get('profiles/:steamId/showcase')
  @ApiOperation({
    operationId: 'listProfileShowcase',
    summary: 'List public profile showcase items',
  })
  @ApiParam({ name: 'steamId', description: 'Steam 64-bit profile id' })
  @ApiOkResponse({ type: ProfileShowcaseResponseDto })
  @ApiNotFoundResponse({ description: 'Profile was not found.' })
  listProfileShowcase(
    @Param() params: SyncSteamIdParamDto,
  ): Promise<ProfileShowcaseResponseDto> {
    return this.showcaseService.listProfileShowcase(params.steamId);
  }

  @Get('account/showcase')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'getAccountShowcase',
    summary: 'Get current account showcase items',
  })
  @ApiOkResponse({ type: AccountShowcaseResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  getAccountShowcase(
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<AccountShowcaseResponseDto> {
    return this.showcaseService.getAccountShowcase(currentUser.userId);
  }

  @Put('account/showcase')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'updateAccountShowcase',
    summary: 'Replace current account showcase items',
  })
  @ApiOkResponse({ type: AccountShowcaseResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiBadRequestResponse({ description: 'Invalid or ineligible showcase items.' })
  @ApiBody({ type: UpdateAccountShowcaseBodyDto })
  updateAccountShowcase(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpdateAccountShowcaseBodyDto,
  ): Promise<AccountShowcaseResponseDto> {
    return this.showcaseService.updateAccountShowcase(
      currentUser.userId,
      body,
    );
  }
}
