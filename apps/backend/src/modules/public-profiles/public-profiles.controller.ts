import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { PublicProfileResponseDto } from './dto/public-profile-response.dto';
import { PublicProfilesService } from './public-profiles.service';

@Controller('public-profiles')
@ApiTags('public-profiles')
export class PublicProfilesController {
  constructor(private readonly publicProfilesService: PublicProfilesService) {}

  @Get(':slug')
  @ApiOperation({
    operationId: 'getPublicProfileBySlug',
    summary: 'Get a published Steam profile by slug',
  })
  @ApiParam({
    name: 'slug',
    type: String,
    example: 'my-steam-profile',
  })
  @ApiOkResponse({ type: PublicProfileResponseDto })
  @ApiNotFoundResponse({ description: 'Public profile is missing or private.' })
  getPublicProfileBySlug(
    @Param('slug') slug: string,
  ): Promise<PublicProfileResponseDto> {
    return this.publicProfilesService.getPublicProfileBySlug(slug);
  }
}
