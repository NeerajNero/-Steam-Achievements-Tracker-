import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ACHIEVEMENT_DATA_STATES,
  type AchievementDataState,
} from '../../games/dto/achievement-data-state.dto';
import { TargetPriorityDto, TargetStatusDto, TargetTypeDto } from './target-request.dto';

export enum TargetResponseTypeDto {
  Game = 'game',
  Achievement = 'achievement',
}

export enum TargetAchievementUnlockStateDto {
  Unlocked = 'unlocked',
  Locked = 'locked',
  Unknown = 'unknown',
}

export class TargetGameResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Demo Complete Quest' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  iconUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  logoUrl!: string | null;

  @ApiProperty({ type: Number, example: 10 })
  totalAchievements!: number;

  @ApiProperty({ type: Number, example: 7 })
  unlockedAchievements!: number;

  @ApiProperty({ type: Number, example: 3 })
  remainingAchievements!: number;

  @ApiProperty({ type: Number, example: 70 })
  completionPercentage!: number;

  @ApiProperty({ enum: ACHIEVEMENT_DATA_STATES, example: 'unlock_state_synced' })
  achievementDataState!: AchievementDataState;
}

export class TargetAchievementResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'ACH_WIN_ONE_GAME' })
  apiName!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'First Win' })
  displayName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Win once.' })
  description!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  iconUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  iconGrayUrl!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 12.4 })
  globalPercentage!: number | null;

  @ApiProperty({ type: Boolean, example: false })
  hidden!: boolean;

  @ApiProperty({ enum: TargetAchievementUnlockStateDto })
  unlockState!: TargetAchievementUnlockStateDto;

  @ApiPropertyOptional({ type: String, nullable: true })
  unlockedAt!: string | null;
}

export class AccountTargetResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ enum: TargetResponseTypeDto })
  type!: TargetResponseTypeDto;

  @ApiProperty({ enum: TargetStatusDto })
  status!: TargetStatusDto;

  @ApiProperty({ enum: TargetPriorityDto })
  priority!: TargetPriorityDto;

  @ApiPropertyOptional({ type: String, nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  targetCompletionPercentage!: number | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  dueDate!: string | null;

  @ApiProperty({ type: String, example: '2026-05-18T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: String, example: '2026-05-18T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ type: TargetGameResponseDto })
  game!: TargetGameResponseDto;

  @ApiPropertyOptional({ type: TargetAchievementResponseDto, nullable: true })
  achievement!: TargetAchievementResponseDto | null;
}

export class AccountTargetsResponseDto {
  @ApiProperty({ type: [AccountTargetResponseDto] })
  items!: AccountTargetResponseDto[];

  @ApiProperty({ type: Number, example: 10 })
  total!: number;

  @ApiProperty({ type: Number, example: 50 })
  limit!: number;

  @ApiProperty({ type: Number, example: 0 })
  offset!: number;
}
