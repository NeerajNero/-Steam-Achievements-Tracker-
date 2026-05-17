import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ContentReportReasonDto,
  ContentReportTargetTypeDto,
  GuideVoteValueDto,
} from './community-request.dto';

export class GuideVoteSummaryResponseDto {
  @ApiProperty({ type: Number, example: 12 })
  upvotes!: number;

  @ApiProperty({ type: Number, example: 2 })
  downvotes!: number;

  @ApiProperty({ type: Number, example: 10 })
  score!: number;

  @ApiPropertyOptional({ enum: GuideVoteValueDto, nullable: true })
  currentUserVote!: -1 | 1 | null;
}

export class CommunityAuthorResponseDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  displayName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  steamId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  publicSlug!: string | null;
}

export class CommentResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  body!: string;

  @ApiProperty({ type: String, example: 'visible' })
  status!: string;

  @ApiProperty({ type: String })
  createdAt!: string;

  @ApiProperty({ type: String })
  updatedAt!: string;

  @ApiProperty({ type: CommunityAuthorResponseDto })
  author!: CommunityAuthorResponseDto;
}

export class CommentListResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  items!: CommentResponseDto[];
}

export class ContentReportResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ enum: ContentReportTargetTypeDto })
  targetType!: string;

  @ApiProperty({ enum: ContentReportReasonDto })
  reason!: string;

  @ApiProperty({ type: String, example: 'open' })
  status!: string;

  @ApiProperty({ type: String })
  createdAt!: string;
}
