import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export enum SyncScopeDto {
  Profile = 'profile',
  Games = 'games',
  Achievements = 'achievements',
}

export type SyncScope = `${SyncScopeDto}`;

export class SyncRequestDto {
  @ApiProperty({
    enum: SyncScopeDto,
    example: SyncScopeDto.Profile,
    description: 'Sync scope to enqueue.',
  })
  @IsEnum(SyncScopeDto)
  scope!: SyncScopeDto;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'integer',
      minimum: 1,
    },
    example: [910001, 910002],
    description:
      'Optional Steam app IDs for achievements sync. Omit to sync achievements for all stored profile games.',
    minItems: 1,
    maxItems: 100,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  appIds?: number[];
}
