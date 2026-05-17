import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { SyncSteamIdParamDto } from '../sync/dto/sync-steam-id-param.dto';
import { ProfileSnapshotQueryDto } from './dto/profile-snapshot-query.dto';
import {
  ProfileSnapshotResponseDto,
  ProfileSnapshotsResponseDto,
} from './dto/profile-snapshot-response.dto';
import { SnapshotsService } from './snapshots.service';

@ApiTags('snapshots')
@Controller('profiles/:steamId/snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Get()
  @ApiOperation({
    operationId: 'listProfileSnapshots',
    summary: 'List profile snapshots',
    description: 'Returns stored aggregate snapshots for a Steam profile.',
  })
  @ApiParam({ name: 'steamId', description: 'Steam 64-bit profile id' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, type: ProfileSnapshotsResponseDto })
  @ApiResponse({ status: 404, description: 'Profile was not found' })
  async listProfileSnapshots(
    @Param() params: SyncSteamIdParamDto,
    @Query() query: ProfileSnapshotQueryDto,
  ): Promise<ProfileSnapshotsResponseDto> {
    return this.snapshotsService.listProfileSnapshots(params.steamId, query);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  @HttpCode(201)
  @ApiOperation({
    operationId: 'createProfileSnapshot',
    summary: 'Create a manual profile snapshot',
    description:
      'Creates a snapshot from current stored profile progress. Requires an authenticated owner of the claimed Steam profile, or an admin/moderator account.',
  })
  @ApiParam({ name: 'steamId', description: 'Steam 64-bit profile id' })
  @ApiResponse({ status: 201, type: ProfileSnapshotResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  @ApiForbiddenResponse({
    description: 'Authenticated user does not own this Steam profile.',
  })
  @ApiResponse({ status: 404, description: 'Profile was not found' })
  async createProfileSnapshot(
    @Param() params: SyncSteamIdParamDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<ProfileSnapshotResponseDto> {
    return this.snapshotsService.createProfileSnapshot(
      params.steamId,
      currentUser,
    );
  }
}
