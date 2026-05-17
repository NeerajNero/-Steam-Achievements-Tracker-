import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { AccountService } from './account.service';
import {
  AccountPreferencesResponseDto,
  AccountPublicProfileResponseDto,
  AccountResponseDto,
} from './dto/account-response.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdatePublicProfileSettingsDto } from './dto/update-public-profile-settings.dto';

@Controller('account')
@ApiTags('account')
@UseGuards(SessionAuthGuard)
@ApiUnauthorizedResponse({ description: 'No active session.' })
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('me')
  @ApiOperation({
    operationId: 'getAccountMe',
    summary: 'Get current account settings',
  })
  @ApiOkResponse({ type: AccountResponseDto })
  getAccountMe(
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<AccountResponseDto> {
    return this.accountService.getAccount(currentUser.userId);
  }

  @Patch('me')
  @ApiOperation({
    operationId: 'updateAccountMe',
    summary: 'Update current account display fields',
  })
  @ApiOkResponse({ type: AccountResponseDto })
  @ApiBody({ type: UpdateAccountDto })
  updateAccountMe(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.updateAccount(currentUser.userId, body);
  }

  @Get('preferences')
  @ApiOperation({
    operationId: 'getAccountPreferences',
    summary: 'Get current account preferences',
  })
  @ApiOkResponse({ type: AccountPreferencesResponseDto })
  getAccountPreferences(
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<AccountPreferencesResponseDto> {
    return this.accountService.getPreferences(currentUser.userId);
  }

  @Patch('preferences')
  @ApiOperation({
    operationId: 'updateAccountPreferences',
    summary: 'Update current account preferences',
  })
  @ApiOkResponse({ type: AccountPreferencesResponseDto })
  @ApiBody({ type: UpdatePreferencesDto })
  updateAccountPreferences(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpdatePreferencesDto,
  ): Promise<AccountPreferencesResponseDto> {
    return this.accountService.updatePreferences(currentUser.userId, body);
  }

  @Get('public-profile')
  @ApiOperation({
    operationId: 'getAccountPublicProfile',
    summary: 'Get current public profile publishing settings',
  })
  @ApiOkResponse({ type: AccountPublicProfileResponseDto })
  getAccountPublicProfile(
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<AccountPublicProfileResponseDto> {
    return this.accountService.getPublicProfileSettings(currentUser.userId);
  }

  @Patch('public-profile')
  @ApiOperation({
    operationId: 'updateAccountPublicProfile',
    summary: 'Update current public profile publishing settings',
  })
  @ApiOkResponse({ type: AccountPublicProfileResponseDto })
  @ApiBody({ type: UpdatePublicProfileSettingsDto })
  @ApiConflictResponse({ description: 'Public profile slug is already in use.' })
  updateAccountPublicProfile(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Body() body: UpdatePublicProfileSettingsDto,
  ): Promise<AccountPublicProfileResponseDto> {
    return this.accountService.updatePublicProfileSettings(
      currentUser.userId,
      body,
    );
  }
}
