import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileDetailResponseDto {
  @ApiProperty({
    type: String,
    example: '4b8413ad-bc3c-4215-9ded-e6ba9fd9f2dd',
    description: 'Internal profile UUID.',
  })
  id!: string;

  @ApiProperty({
    type: String,
    example: '76561198000000000',
    description: 'Steam 64-bit profile ID.',
  })
  steamId!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Demo Achievement Hunter',
    nullable: true,
    description: 'Current Steam persona name, when visible.',
  })
  personaName!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: null,
    nullable: true,
    description: 'Steam avatar URL, when available.',
  })
  avatarUrl!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: null,
    nullable: true,
    description: 'Steam community profile URL, when available.',
  })
  profileUrl!: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 3,
    nullable: true,
    description: 'Steam visibility state returned by the Steam Web API.',
  })
  visibilityState!: number | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether the profile is private or unavailable for sync.',
  })
  isPrivate!: boolean;

  @ApiPropertyOptional({
    type: String,
    example: '2026-05-16T05:07:30.710Z',
    nullable: true,
    description: 'Last time this profile was synced from Steam.',
  })
  lastSyncedAt!: string | null;

  @ApiProperty({
    type: String,
    example: '2026-05-16T05:07:30.710Z',
    description: 'Profile row creation timestamp.',
  })
  createdAt!: string;

  @ApiProperty({
    type: String,
    example: '2026-05-16T05:07:30.710Z',
    description: 'Profile row update timestamp.',
  })
  updatedAt!: string;
}
