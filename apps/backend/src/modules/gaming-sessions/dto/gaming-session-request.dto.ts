import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum GamingSessionStatusDto {
  Open = 'open',
  Full = 'full',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum GamingSessionVisibilityDto {
  Public = 'public',
  Unlisted = 'unlisted',
  Private = 'private',
}

export class CreateGamingSessionDto {
  @ApiProperty({ type: String, minLength: 3, maxLength: 120 })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiProperty({ type: String, example: '2026-05-18T15:00:00.000Z' })
  @IsDateString()
  scheduledStartAt!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledEndAt?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 100, example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string | null;

  @ApiPropertyOptional({ type: Number, minimum: 2, maximum: 100, default: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(100)
  maxParticipants: number = 4;

  @ApiPropertyOptional({
    enum: GamingSessionVisibilityDto,
    default: GamingSessionVisibilityDto.Public,
  })
  @IsOptional()
  @IsEnum(GamingSessionVisibilityDto)
  visibility: GamingSessionVisibilityDto = GamingSessionVisibilityDto.Public;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUrl({ require_tld: false })
  externalVoiceUrl?: string | null;
}

export class UpdateGamingSessionDto {
  @ApiPropertyOptional({ type: String, minLength: 3, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  scheduledStartAt?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledEndAt?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string | null;

  @ApiPropertyOptional({ type: Number, minimum: 2, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(100)
  maxParticipants?: number;

  @ApiPropertyOptional({ enum: GamingSessionVisibilityDto })
  @IsOptional()
  @IsEnum(GamingSessionVisibilityDto)
  visibility?: GamingSessionVisibilityDto;

  @ApiPropertyOptional({ enum: GamingSessionStatusDto })
  @IsOptional()
  @IsEnum(GamingSessionStatusDto)
  status?: GamingSessionStatusDto;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUrl({ require_tld: false })
  externalVoiceUrl?: string | null;
}

export class AddSessionAchievementsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  achievementIds!: string[];
}
