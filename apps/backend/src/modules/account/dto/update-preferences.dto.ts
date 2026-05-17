import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export enum AccountDefaultGameSortDto {
  Completion = 'completion',
  Name = 'name',
  Playtime = 'playtime',
  RecentlyPlayed = 'recently_played',
  Remaining = 'remaining',
}

export enum AccountDefaultGameOrderDto {
  Asc = 'asc',
  Desc = 'desc',
}

export class AccountPreferenceSettingsDto {
  @IsOptional()
  @IsEnum(AccountDefaultGameSortDto)
  defaultGameSort?: AccountDefaultGameSortDto;

  @IsOptional()
  @IsEnum(AccountDefaultGameOrderDto)
  defaultGameOrder?: AccountDefaultGameOrderDto;

  @IsOptional()
  @IsBoolean()
  showPrivateHints?: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({
    type: AccountPreferenceSettingsDto,
    example: {
      defaultGameSort: 'completion',
      defaultGameOrder: 'desc',
      showPrivateHints: true,
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AccountPreferenceSettingsDto)
  settings!: AccountPreferenceSettingsDto;
}
