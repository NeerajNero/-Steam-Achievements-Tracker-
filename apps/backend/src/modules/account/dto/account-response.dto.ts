import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountUserResponseDto {
  @ApiProperty({ type: String, example: 'c1a4f4d1-2f3d-4a3a-8e6e-8f3a4e7f8b6d' })
  id!: string;

  @ApiPropertyOptional({ type: String, example: 'Steam User', nullable: true })
  displayName!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://avatars.steamstatic.com/example.jpg',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({ enum: ['user', 'moderator', 'admin'], example: 'user' })
  role!: string;

  @ApiProperty({ enum: ['active', 'disabled', 'deleted'], example: 'active' })
  status!: string;
}

export class AccountSteamAccountResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: String, example: 'f0a6d95f-8d8c-4e9b-bc11-2f5a5f8c4f0f' })
  steamProfileId!: string;

  @ApiPropertyOptional({ type: String, example: 'Steam Persona', nullable: true })
  personaName!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://avatars.akamai.steamstatic.com/example.jpg',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  isPrimary!: boolean;
}

export class AccountPreferencesResponseDto {
  @ApiProperty({
    type: Object,
    example: {
      defaultGameSort: 'completion',
      defaultGameOrder: 'desc',
      showPrivateHints: true,
    },
  })
  settings!: AccountPreferenceSettings;
}

export class AccountPublicProfileResponseDto {
  @ApiPropertyOptional({ type: String, example: 'my-steam-profile', nullable: true })
  slug!: string | null;

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
  settings!: PublicProfileSettings;
}

export class AccountResponseDto {
  @ApiProperty({ type: AccountUserResponseDto })
  user!: AccountUserResponseDto;

  @ApiPropertyOptional({
    type: AccountSteamAccountResponseDto,
    nullable: true,
  })
  steamAccount!: AccountSteamAccountResponseDto | null;

  @ApiProperty({ type: AccountPreferencesResponseDto })
  preferences!: AccountPreferencesResponseDto;

  @ApiPropertyOptional({
    type: AccountPublicProfileResponseDto,
    nullable: true,
  })
  publicProfile!: AccountPublicProfileResponseDto | null;
}

export type AccountPreferenceSettings = Partial<{
  defaultGameSort: 'completion' | 'name' | 'playtime' | 'recently_played' | 'remaining';
  defaultGameOrder: 'asc' | 'desc';
  showPrivateHints: boolean;
}>;

export type PublicProfileSettings = Partial<{
  showRarestAchievements: boolean;
  showRecentSyncs: boolean;
  showSteamId: boolean;
}>;
