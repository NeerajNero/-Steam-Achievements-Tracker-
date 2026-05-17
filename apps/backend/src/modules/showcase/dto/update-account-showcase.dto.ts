import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ShowcaseItemTypeDto,
  ShowcaseVisibilityDto,
} from './showcase-response.dto';

export class UpdateAccountShowcaseItemDto {
  @ApiProperty({ enum: ShowcaseItemTypeDto, example: ShowcaseItemTypeDto.Badge })
  @IsEnum(ShowcaseItemTypeDto)
  itemType!: ShowcaseItemTypeDto;

  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ type: Number, minimum: 0, example: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position!: number;

  @ApiProperty({ enum: ShowcaseVisibilityDto, example: ShowcaseVisibilityDto.Public })
  @IsEnum(ShowcaseVisibilityDto)
  visibility!: ShowcaseVisibilityDto;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  titleOverride?: string | null;
}

export class UpdateAccountShowcaseDto {
  @ApiProperty({ type: [UpdateAccountShowcaseItemDto], maxItems: 6 })
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => UpdateAccountShowcaseItemDto)
  items!: UpdateAccountShowcaseItemDto[];
}
