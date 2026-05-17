import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum GuideVisibilityDto {
  Public = 'public',
  Unlisted = 'unlisted',
  Private = 'private',
}

export enum GuideStatusDto {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export class CreateGuideDto {
  @ApiProperty({
    type: String,
    minLength: 3,
    maxLength: 120,
    example: '100% Roadmap',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 500,
    example: 'A clean route for completing every achievement.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiPropertyOptional({ enum: GuideVisibilityDto, default: GuideVisibilityDto.Public })
  @IsOptional()
  @IsEnum(GuideVisibilityDto)
  visibility: GuideVisibilityDto = GuideVisibilityDto.Public;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 10, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  estimatedDifficulty?: number | null;

  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedHours?: number | null;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  isSpoilerHeavy: boolean = false;
}

export class UpdateGuideDto {
  @ApiPropertyOptional({ type: String, minLength: 3, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ type: String, maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string | null;

  @ApiPropertyOptional({ enum: GuideVisibilityDto })
  @IsOptional()
  @IsEnum(GuideVisibilityDto)
  visibility?: GuideVisibilityDto;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 10, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  estimatedDifficulty?: number | null;

  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedHours?: number | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isSpoilerHeavy?: boolean;

  @ApiPropertyOptional({ enum: GuideStatusDto })
  @IsOptional()
  @IsEnum(GuideStatusDto)
  status?: GuideStatusDto;
}

export class CreateGuideSectionDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ type: String, minLength: 1, maxLength: 20000 })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content!: string;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position: number = 0;
}

export class UpdateGuideSectionDto {
  @ApiPropertyOptional({ type: String, minLength: 1, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ type: String, minLength: 1, maxLength: 20000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content?: string;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class AddGuideAchievementsDto {
  @ApiProperty({
    type: [String],
    example: ['3dd0928a-28f6-4e9b-a5ad-164d536b8d95'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  achievementIds!: string[];
}
