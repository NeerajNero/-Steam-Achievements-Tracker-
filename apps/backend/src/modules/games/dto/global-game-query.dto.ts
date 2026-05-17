import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { SortOrderDto } from './game-library-query.dto';

export enum GlobalGameSortDto {
  Name = 'name',
  TrackedPlayers = 'tracked_players',
  CompletionRate = 'completion_rate',
  Achievements = 'achievements',
  Playtime = 'playtime',
}

export class GlobalGameQueryDto {
  @ApiPropertyOptional({
    example: 'demo',
    maxLength: 120,
    description: 'Case-insensitive search against stored game names.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'When provided, filters games by achievement support.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === true || value === 'true') {
      return true;
    }

    if (value === false || value === 'false') {
      return false;
    }

    return value;
  })
  @IsBoolean()
  hasAchievements?: boolean;

  @ApiPropertyOptional({
    enum: GlobalGameSortDto,
    default: GlobalGameSortDto.TrackedPlayers,
  })
  @IsOptional()
  @IsEnum(GlobalGameSortDto)
  sort: GlobalGameSortDto = GlobalGameSortDto.TrackedPlayers;

  @ApiPropertyOptional({
    enum: SortOrderDto,
    default: SortOrderDto.Desc,
  })
  @IsOptional()
  @IsEnum(SortOrderDto)
  order: SortOrderDto = SortOrderDto.Desc;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25;

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
