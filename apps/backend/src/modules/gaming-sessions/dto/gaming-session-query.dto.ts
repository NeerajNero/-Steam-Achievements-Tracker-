import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { GamingSessionStatusDto } from './gaming-session-request.dto';

export class SessionListQueryDto {
  @ApiPropertyOptional({ enum: GamingSessionStatusDto, default: GamingSessionStatusDto.Open })
  @IsOptional()
  @IsEnum(GamingSessionStatusDto)
  status: GamingSessionStatusDto = GamingSessionStatusDto.Open;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  to?: string;

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

export class GlobalSessionListQueryDto extends SessionListQueryDto {
  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  steamAppId?: number;
}
