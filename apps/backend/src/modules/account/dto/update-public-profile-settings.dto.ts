import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class PublicProfileSettingsDto {
  @IsOptional()
  @IsBoolean()
  showRarestAchievements?: boolean;

  @IsOptional()
  @IsBoolean()
  showRecentSyncs?: boolean;

  @IsOptional()
  @IsBoolean()
  showSteamId?: boolean;
}

export class UpdatePublicProfileSettingsDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'my-steam-profile',
    description:
      'Lowercase public profile slug. Use null to clear the slug.',
  })
  @ValidateIf((input: UpdatePublicProfileSettingsDto) => input.slug !== undefined && input.slug !== null)
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    type: PublicProfileSettingsDto,
    example: {
      showRarestAchievements: true,
      showRecentSyncs: true,
      showSteamId: true,
    },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PublicProfileSettingsDto)
  settings?: PublicProfileSettingsDto;
}
