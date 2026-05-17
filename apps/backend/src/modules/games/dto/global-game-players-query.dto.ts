import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { SortOrderDto } from './game-library-query.dto';

export enum GlobalGamePlayerStatusDto {
  All = 'all',
  Completed = 'completed',
  Incomplete = 'incomplete',
}

export enum GlobalGamePlayerSortDto {
  Completion = 'completion',
  Playtime = 'playtime',
  RecentlyPlayed = 'recently_played',
}

export class GlobalGamePlayersQueryDto {
  @ApiPropertyOptional({
    enum: GlobalGamePlayerStatusDto,
    default: GlobalGamePlayerStatusDto.All,
  })
  @IsOptional()
  @IsEnum(GlobalGamePlayerStatusDto)
  status: GlobalGamePlayerStatusDto = GlobalGamePlayerStatusDto.All;

  @ApiPropertyOptional({
    enum: GlobalGamePlayerSortDto,
    default: GlobalGamePlayerSortDto.Completion,
  })
  @IsOptional()
  @IsEnum(GlobalGamePlayerSortDto)
  sort: GlobalGamePlayerSortDto = GlobalGamePlayerSortDto.Completion;

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
