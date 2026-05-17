import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { GameLibraryItemResponseDto } from '../../games/dto/game-library-response.dto';
import { RarestAchievementResponseDto } from '../../achievements/dto/rarest-achievements-response.dto';
import { ProfileSummaryResponseDto } from '../../profiles/dto/profile-summary-response.dto';

class PublicProfileInfoResponseDto {
  @ApiProperty({ type: String, example: 'my-steam-profile' })
  slug!: string;

  @ApiProperty({ type: Boolean, example: true })
  isPublic!: boolean;

  @ApiProperty({
    type: Object,
    example: {
      showRarestAchievements: true,
      showRecentSyncs: true,
      showSteamId: true,
    },
  })
  settings!: Record<string, unknown>;
}

class PublicSteamProfileResponseDto {
  @ApiPropertyOptional({ type: String, example: '76561198000000000', nullable: true })
  steamId!: string | null;

  @ApiPropertyOptional({ type: String, example: 'Steam Persona', nullable: true })
  personaName!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://avatars.akamai.steamstatic.com/example.jpg',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://steamcommunity.com/id/example',
    nullable: true,
  })
  profileUrl!: string | null;

  @ApiProperty({ type: Boolean, example: false })
  isPrivate!: boolean;

  @ApiPropertyOptional({
    type: String,
    example: '2026-05-16T05:07:30.710Z',
    nullable: true,
  })
  lastSyncedAt!: string | null;
}

export class PublicProfileResponseDto {
  @ApiProperty({ type: PublicProfileInfoResponseDto })
  publicProfile!: PublicProfileInfoResponseDto;

  @ApiProperty({ type: PublicSteamProfileResponseDto })
  steamProfile!: PublicSteamProfileResponseDto;

  @ApiProperty({ type: ProfileSummaryResponseDto })
  summary!: ProfileSummaryResponseDto;

  @ApiProperty({ type: [GameLibraryItemResponseDto] })
  nearestCompletions!: GameLibraryItemResponseDto[];

  @ApiProperty({ type: [RarestAchievementResponseDto] })
  rarestAchievements!: RarestAchievementResponseDto[];
}
