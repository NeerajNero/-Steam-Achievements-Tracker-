import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  ValidateIf,
} from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    type: String,
    minLength: 1,
    maxLength: 80,
    example: 'Achievement Hunter',
  })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  displayName?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://avatars.steamstatic.com/example.jpg',
  })
  @ValidateIf((input: UpdateAccountDto) => input.avatarUrl !== undefined && input.avatarUrl !== null)
  @IsString()
  @IsUrl({ require_tld: false })
  avatarUrl?: string | null;
}
