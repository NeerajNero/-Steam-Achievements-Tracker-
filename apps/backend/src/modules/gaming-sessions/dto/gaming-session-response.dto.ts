import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  GamingSessionStatusDto,
  GamingSessionVisibilityDto,
} from './gaming-session-request.dto';

export class SessionUserResponseDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  displayName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  steamId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  publicSlug!: string | null;
}

export class GamingSessionSummaryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: Number })
  steamAppId!: number;

  @ApiProperty({ type: String })
  gameName!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  gameIconUrl!: string | null;

  @ApiProperty({ type: String })
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ enum: GamingSessionStatusDto })
  status!: string;

  @ApiProperty({ enum: GamingSessionVisibilityDto })
  visibility!: string;

  @ApiProperty({ type: String })
  scheduledStartAt!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  scheduledEndAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  timezone!: string | null;

  @ApiProperty({ type: Number })
  maxParticipants!: number;

  @ApiProperty({ type: Number })
  participantCount!: number;

  @ApiProperty({ type: Number })
  achievementCount!: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  externalVoiceUrl!: string | null;

  @ApiProperty({ type: SessionUserResponseDto })
  host!: SessionUserResponseDto;

  @ApiProperty({ type: String })
  createdAt!: string;

  @ApiProperty({ type: String })
  updatedAt!: string;
}

export class GamingSessionParticipantResponseDto {
  @ApiProperty({ type: String })
  role!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String })
  joinedAt!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  leftAt!: string | null;

  @ApiProperty({ type: SessionUserResponseDto })
  user!: SessionUserResponseDto;
}

export class GamingSessionAchievementResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  apiName!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  displayName!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  globalPercentage!: number | null;

  @ApiProperty({ type: Boolean })
  hidden!: boolean;
}

export class GamingSessionDetailResponseDto extends GamingSessionSummaryResponseDto {
  @ApiProperty({ type: [GamingSessionParticipantResponseDto] })
  participants!: GamingSessionParticipantResponseDto[];

  @ApiProperty({ type: [GamingSessionAchievementResponseDto] })
  achievements!: GamingSessionAchievementResponseDto[];
}

export class GamingSessionListResponseDto {
  @ApiProperty({ type: [GamingSessionSummaryResponseDto] })
  items!: GamingSessionSummaryResponseDto[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  limit!: number;

  @ApiProperty({ type: Number })
  offset!: number;
}

export class AddSessionAchievementsResponseDto {
  @ApiProperty({ type: Number })
  added!: number;
}
