import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum ActivityEventTypeDto {
  ProfileSynced = 'profile_synced',
  GameCompleted = 'game_completed',
  RareAchievementSynced = 'rare_achievement_synced',
  GuidePublished = 'guide_published',
  GuideCommented = 'guide_commented',
  GuideVoted = 'guide_voted',
  SessionCreated = 'session_created',
  SessionJoined = 'session_joined',
  SessionCommented = 'session_commented',
  MilestoneReached = 'milestone_reached',
}

export class ActivityQueryDto {
  @ApiPropertyOptional({ enum: ActivityEventTypeDto })
  @IsOptional()
  @IsEnum(ActivityEventTypeDto)
  eventType?: ActivityEventTypeDto;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 30;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class GameActivityQueryDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 30;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
