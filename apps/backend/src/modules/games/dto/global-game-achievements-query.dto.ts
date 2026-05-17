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

import { SortOrderDto } from './game-library-query.dto';

export enum GlobalGameAchievementHiddenDto {
  All = 'all',
  Visible = 'visible',
  Hidden = 'hidden',
}

export enum GlobalGameAchievementSortDto {
  Rarity = 'rarity',
  Name = 'name',
}

export class GlobalGameAchievementsQueryDto {
  @ApiPropertyOptional({
    example: 'first',
    maxLength: 120,
    description: 'Case-insensitive search against achievement API/display names.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: GlobalGameAchievementHiddenDto,
    default: GlobalGameAchievementHiddenDto.All,
  })
  @IsOptional()
  @IsEnum(GlobalGameAchievementHiddenDto)
  hidden: GlobalGameAchievementHiddenDto = GlobalGameAchievementHiddenDto.All;

  @ApiPropertyOptional({
    enum: GlobalGameAchievementSortDto,
    default: GlobalGameAchievementSortDto.Rarity,
  })
  @IsOptional()
  @IsEnum(GlobalGameAchievementSortDto)
  sort: GlobalGameAchievementSortDto = GlobalGameAchievementSortDto.Rarity;

  @ApiPropertyOptional({
    enum: SortOrderDto,
    default: SortOrderDto.Asc,
  })
  @IsOptional()
  @IsEnum(SortOrderDto)
  order: SortOrderDto = SortOrderDto.Asc;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 500,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit: number = 100;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
