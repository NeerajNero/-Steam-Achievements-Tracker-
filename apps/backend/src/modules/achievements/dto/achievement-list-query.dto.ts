import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { SortOrderDto } from '../../games/dto/game-library-query.dto';

export enum AchievementStatusDto {
  All = 'all',
  Unlocked = 'unlocked',
  Locked = 'locked',
}

export enum AchievementSortDto {
  Rarity = 'rarity',
  UnlockedAt = 'unlocked_at',
  Name = 'name',
}

export class AchievementListQueryDto {
  @ApiPropertyOptional({
    enum: AchievementStatusDto,
    default: AchievementStatusDto.All,
  })
  @IsOptional()
  @IsEnum(AchievementStatusDto)
  status: AchievementStatusDto = AchievementStatusDto.All;

  @ApiPropertyOptional({
    enum: AchievementSortDto,
    default: AchievementSortDto.Rarity,
  })
  @IsOptional()
  @IsEnum(AchievementSortDto)
  sort: AchievementSortDto = AchievementSortDto.Rarity;

  @ApiPropertyOptional({
    enum: SortOrderDto,
    default: SortOrderDto.Asc,
  })
  @IsOptional()
  @IsEnum(SortOrderDto)
  order: SortOrderDto = SortOrderDto.Asc;
}
