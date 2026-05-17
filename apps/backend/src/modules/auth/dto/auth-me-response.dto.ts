import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

class AuthUserResponseDto {
  @ApiProperty({
    type: String,
    example: 'c1a4f4d1-2f3d-4a3a-8e6e-8f3a4e7f8b6d',
  })
  id!: string;

  @ApiPropertyOptional({ type: String, example: 'Steam User', nullable: true })
  displayName!: string | null;

  @ApiPropertyOptional({ type: String, example: 'https://avatars.steamstatic.com/...' , nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ enum: ['user', 'moderator', 'admin'], example: 'user' })
  role!: string;

  @ApiProperty({ enum: ['active', 'disabled', 'deleted'], example: 'active' })
  status!: string;
}

class AuthSteamAccountResponseDto {
  @ApiProperty({
    type: String,
    example: '76561198000000000',
  })
  steamId!: string;

  @ApiProperty({
    type: String,
    example: 'f0a6d95f-8d8c-4e9b-bc11-2f5a5f8c4f0f',
  })
  steamProfileId!: string;

  @ApiPropertyOptional({ type: String, example: 'TestUser', nullable: true })
  personaName!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://avatars.akamai.steamstatic.com/...',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  isPrimary!: boolean;
}

class AuthPublicProfileResponseDto {
  @ApiPropertyOptional({
    type: String,
    example: 'my-steam-profile',
    nullable: true,
  })
  slug!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  isPublic!: boolean;
}

export class AuthMeResponseDto {
  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;

  @ApiPropertyOptional({
    type: AuthSteamAccountResponseDto,
    nullable: true,
  })
  steamAccount!: AuthSteamAccountResponseDto | null;

  @ApiPropertyOptional({
    type: AuthPublicProfileResponseDto,
    nullable: true,
  })
  publicProfile!: AuthPublicProfileResponseDto | null;
}

export class StartSteamLoginQueryDto {
  @ApiPropertyOptional({
    type: String,
    required: false,
    example: '/profiles/76561198000000000',
    description:
    'Optional frontend return path. Only same-origin relative paths are accepted.',
  })
  @IsOptional()
  @IsString()
  returnTo?: string;
}
