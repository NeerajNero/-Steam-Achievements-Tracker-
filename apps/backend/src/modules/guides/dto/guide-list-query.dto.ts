import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum PublicGuideStatusDto {
  Published = 'published',
}

export class GuideListQueryDto {
  @ApiPropertyOptional({
    enum: PublicGuideStatusDto,
    default: PublicGuideStatusDto.Published,
    description: 'Public guide lists return published guides only.',
  })
  @IsOptional()
  @IsEnum(PublicGuideStatusDto)
  status?: PublicGuideStatusDto = PublicGuideStatusDto.Published;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Case-insensitive search against guide title and summary.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
