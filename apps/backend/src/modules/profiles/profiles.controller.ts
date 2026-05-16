import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ProfileDetailResponseDto } from './dto/profile-detail-response.dto';
import { ProfileSummaryResponseDto } from './dto/profile-summary-response.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
@ApiTags('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':steamId')
  @ApiOperation({
    operationId: 'getProfile',
    summary: 'Get stored Steam profile metadata',
    description: 'Reads profile metadata from PostgreSQL only.',
  })
  @ApiParam({
    name: 'steamId',
    type: String,
    example: '76561198000000000',
    description: 'Steam 64-bit profile ID.',
  })
  @ApiOkResponse({ type: ProfileDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Profile has not been synced.' })
  getProfile(
    @Param('steamId') steamId: string,
  ): Promise<ProfileDetailResponseDto> {
    return this.profilesService.getProfileBySteamId(steamId);
  }

  @Get(':steamId/summary')
  @ApiOperation({
    operationId: 'getProfileSummary',
    summary: 'Get profile dashboard summary',
    description:
      'Returns aggregate completion data from stored profile game progress.',
  })
  @ApiParam({
    name: 'steamId',
    type: String,
    example: '76561198000000000',
    description: 'Steam 64-bit profile ID.',
  })
  @ApiOkResponse({ type: ProfileSummaryResponseDto })
  @ApiNotFoundResponse({ description: 'Profile has not been synced.' })
  getProfileSummary(
    @Param('steamId') steamId: string,
  ): Promise<ProfileSummaryResponseDto> {
    return this.profilesService.getProfileSummary(steamId);
  }
}
