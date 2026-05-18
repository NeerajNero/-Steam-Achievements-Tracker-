import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum TargetStatusDto {
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Ignored = 'ignored',
  Archived = 'archived',
}

export enum TargetPriorityDto {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum TargetTypeDto {
  Game = 'game',
  Achievement = 'achievement',
  All = 'all',
}

export class ListAccountTargetsQueryDto {
  @ApiPropertyOptional({ enum: TargetStatusDto })
  @IsOptional()
  @IsEnum(TargetStatusDto)
  status?: TargetStatusDto;

  @ApiPropertyOptional({ enum: TargetTypeDto, default: TargetTypeDto.All })
  @IsOptional()
  @IsEnum(TargetTypeDto)
  type: TargetTypeDto = TargetTypeDto.All;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class CreateGameTargetDto {
  @ApiProperty({ type: Number, example: 910001 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  steamAppId!: number;

  @ApiPropertyOptional({ enum: TargetPriorityDto, default: TargetPriorityDto.Medium })
  @IsOptional()
  @IsEnum(TargetPriorityDto)
  priority: TargetPriorityDto = TargetPriorityDto.Medium;

  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiPropertyOptional({ type: Number, minimum: 0, maximum: 100, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  targetCompletionPercentage?: number | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}

export class UpdateGameTargetDto {
  @ApiPropertyOptional({ enum: TargetStatusDto })
  @IsOptional()
  @IsEnum(TargetStatusDto)
  status?: TargetStatusDto;

  @ApiPropertyOptional({ enum: TargetPriorityDto })
  @IsOptional()
  @IsEnum(TargetPriorityDto)
  priority?: TargetPriorityDto;

  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiPropertyOptional({ type: Number, minimum: 0, maximum: 100, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  targetCompletionPercentage?: number | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}

export class CreateAchievementTargetDto {
  @ApiProperty({
    type: String,
    example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95',
  })
  @IsUUID('4')
  achievementId!: string;

  @ApiPropertyOptional({ enum: TargetPriorityDto, default: TargetPriorityDto.Medium })
  @IsOptional()
  @IsEnum(TargetPriorityDto)
  priority: TargetPriorityDto = TargetPriorityDto.Medium;

  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}

export class UpdateAchievementTargetDto {
  @ApiPropertyOptional({ enum: TargetStatusDto })
  @IsOptional()
  @IsEnum(TargetStatusDto)
  status?: TargetStatusDto;

  @ApiPropertyOptional({ enum: TargetPriorityDto })
  @IsOptional()
  @IsEnum(TargetPriorityDto)
  priority?: TargetPriorityDto;

  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
