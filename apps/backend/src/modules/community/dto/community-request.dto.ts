import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export enum GuideVoteValueDto {
  Downvote = -1,
  Upvote = 1,
}

export enum ContentReportTargetTypeDto {
  Guide = 'guide',
  GuideComment = 'guide_comment',
  GamingSession = 'gaming_session',
  SessionComment = 'session_comment',
}

export enum ContentReportReasonDto {
  Spam = 'spam',
  Abuse = 'abuse',
  OffTopic = 'off_topic',
  Cheating = 'cheating',
  Other = 'other',
}

export class UpsertGuideVoteDto {
  @ApiProperty({ enum: GuideVoteValueDto, example: GuideVoteValueDto.Upvote })
  @IsInt()
  @Min(-1)
  @Max(1)
  value!: GuideVoteValueDto;
}

export class CreateCommentDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class UpdateCommentDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class CreateContentReportDto {
  @ApiProperty({ enum: ContentReportTargetTypeDto })
  @IsEnum(ContentReportTargetTypeDto)
  targetType!: ContentReportTargetTypeDto;

  @ApiProperty({ type: String })
  @IsUUID('4')
  targetId!: string;

  @ApiProperty({ enum: ContentReportReasonDto })
  @IsEnum(ContentReportReasonDto)
  reason!: ContentReportReasonDto;

  @ApiPropertyOptional({ type: String, maxLength: 2000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string | null;
}
