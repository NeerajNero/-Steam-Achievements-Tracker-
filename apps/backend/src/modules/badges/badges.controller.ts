import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { SyncSteamIdParamDto } from '../sync/dto/sync-steam-id-param.dto';
import { BadgesService } from './badges.service';
import {
  BadgeListResponseDto,
  ProfileBadgesResponseDto,
} from './dto/badge-response.dto';

@ApiTags('badges')
@Controller()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('badges')
  @ApiOperation({
    operationId: 'listBadges',
    summary: 'List active badge definitions',
  })
  @ApiOkResponse({ type: BadgeListResponseDto })
  listBadges(): Promise<BadgeListResponseDto> {
    return this.badgesService.listBadges();
  }

  @Get('profiles/:steamId/badges')
  @ApiOperation({
    operationId: 'listProfileBadges',
    summary: 'List earned profile badges',
  })
  @ApiParam({ name: 'steamId', description: 'Steam 64-bit profile id' })
  @ApiOkResponse({ type: ProfileBadgesResponseDto })
  @ApiNotFoundResponse({ description: 'Profile was not found.' })
  listProfileBadges(
    @Param() params: SyncSteamIdParamDto,
  ): Promise<ProfileBadgesResponseDto> {
    return this.badgesService.listProfileBadges(params.steamId);
  }
}
