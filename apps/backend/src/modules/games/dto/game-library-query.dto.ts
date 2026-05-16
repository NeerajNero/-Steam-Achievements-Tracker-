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

export enum GameLibraryStatusDto {
  All = 'all',
  Completed = 'completed',
  Incomplete = 'incomplete',
  NoAchievements = 'no_achievements',
}

export enum GameLibrarySortDto {
  Name = 'name',
  Completion = 'completion',
  Playtime = 'playtime',
  RecentlyPlayed = 'recently_played',
  Remaining = 'remaining',
}

export enum SortOrderDto {
  Asc = 'asc',
  Desc = 'desc',
}

export class GameLibraryQueryDto {
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
    enum: GameLibraryStatusDto,
    default: GameLibraryStatusDto.All,
  })
  @IsOptional()
  @IsEnum(GameLibraryStatusDto)
  status: GameLibraryStatusDto = GameLibraryStatusDto.All;

  @ApiPropertyOptional({
    enum: GameLibrarySortDto,
    default: GameLibrarySortDto.Completion,
    description: 'Default sorting prioritizes games closest to completion.',
  })
  @IsOptional()
  @IsEnum(GameLibrarySortDto)
  sort: GameLibrarySortDto = GameLibrarySortDto.Completion;

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
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

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
