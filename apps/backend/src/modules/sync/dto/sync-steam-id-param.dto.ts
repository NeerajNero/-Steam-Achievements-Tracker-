import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SyncSteamIdParamDto {
  @ApiProperty({
    example: '76561198000000000',
    pattern: '^\\d{17}$',
    description: 'Steam 64-bit profile ID.',
  })
  @IsString()
  @Matches(/^\d{17}$/, {
    message: 'steamId must be a 17 digit Steam 64-bit ID string',
  })
  steamId!: string;
}
