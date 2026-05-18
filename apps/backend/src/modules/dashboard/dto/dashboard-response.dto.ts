import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ACHIEVEMENT_DATA_STATES,
  type AchievementDataState,
} from '../../games/dto/achievement-data-state.dto';
import { SyncRunStatusDto, SyncRunTypeDto } from '../../sync/dto/sync-history-response.dto';
import { AccountTargetResponseDto } from '../../targets/dto/target-response.dto';

export enum DashboardStatusDto {
  Ready = 'ready',
  LinkRequired = 'link_required',
}

export enum DashboardTargetTypeDto {
  ClosestCompletion = 'closest_completion',
  RecentlyPlayedIncomplete = 'recently_played_incomplete',
  HighPlaytimeUnfinished = 'high_playtime_unfinished',
  MetadataOnly = 'metadata_only',
  NotSynced = 'not_synced',
  GuideAvailable = 'guide_available',
  SessionAvailable = 'session_available',
}

export class DashboardViewerResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Steam Hunter' })
  displayName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  avatarUrl!: string | null;
}

export class DashboardProfileResponseDto {
  @ApiProperty({ type: String, example: '76561198000000000' })
  steamId!: string;

  @ApiProperty({ type: String, example: 'steam-profile-id' })
  steamProfileId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Demo Hunter' })
  personaName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'https://steamcommunity.com/profiles/76561198000000000' })
  profileUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'demo-hunter' })
  publicSlug!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  publicProfileIsPublished!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-05-18T12:00:00.000Z' })
  lastSyncedAt!: string | null;
}

export class DashboardSummaryResponseDto {
  @ApiProperty({ type: Number, example: 118 })
  totalGames!: number;

  @ApiProperty({ type: Number, example: 12 })
  completedGames!: number;

  @ApiProperty({ type: Number, example: 7414 })
  totalAchievements!: number;

  @ApiProperty({ type: Number, example: 7373 })
  unlockedAchievements!: number;

  @ApiProperty({ type: Number, example: 41 })
  remainingAchievements!: number;

  @ApiProperty({ type: Number, example: 62.4 })
  averageCompletionPercentage!: number;
}

export class DashboardSyncRunResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ enum: SyncRunTypeDto, example: SyncRunTypeDto.Achievements })
  syncType!: string;

  @ApiProperty({ enum: SyncRunStatusDto, example: SyncRunStatusDto.Success })
  status!: string;

  @ApiProperty({ type: String, example: '2026-05-18T12:00:00.000Z' })
  startedAt!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-05-18T12:00:04.000Z' })
  finishedAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  errorMessage!: string | null;
}

export class DashboardGameRefResponseDto {
  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Demo Complete Quest' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  iconUrl!: string | null;

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

  @ApiProperty({ type: Number, example: 1240 })
  playtimeMinutes!: number;

  @ApiProperty({ type: Number, example: 45 })
  playtimeTwoWeeksMinutes!: number;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-05-16T12:00:00.000Z' })
  lastPlayedAt!: string | null;
}

export class DashboardNextTargetResponseDto {
  @ApiProperty({ enum: DashboardTargetTypeDto, example: DashboardTargetTypeDto.ClosestCompletion })
  type!: DashboardTargetTypeDto;

  @ApiProperty({ type: String, example: 'Only 3 achievements remaining' })
  reason!: string;

  @ApiProperty({ type: String, example: '/profiles/76561198000000000/games/910001' })
  href!: string;

  @ApiProperty({ type: DashboardGameRefResponseDto })
  game!: DashboardGameRefResponseDto;

  @ApiPropertyOptional({ type: String, nullable: true, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  guideId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'complete-route' })
  guideSlug!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  sessionId!: string | null;
}

export class DashboardActivityResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: String, example: 'profile_synced' })
  eventType!: string;

  @ApiProperty({ type: String, example: '2026-05-18T12:00:00.000Z' })
  occurredAt!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 910001 })
  steamAppId!: number | null;

  @ApiProperty({ type: String, example: 'steam_profile' })
  entityType!: string;

  @ApiProperty({ type: Object, example: { scope: 'achievements' } })
  metadata!: Record<string, unknown>;
}

export class DashboardMilestoneResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: String, example: 'completion_percentage' })
  milestoneType!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 75 })
  thresholdValue!: number | null;

  @ApiProperty({ type: String, example: '75% Average Completion' })
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Reached 75% average completion.' })
  description!: string | null;

  @ApiProperty({ type: String, example: '2026-05-18T12:00:00.000Z' })
  achievedAt!: string;
}

export class DashboardBadgeResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: String, example: 'first-sync' })
  code!: string;

  @ApiProperty({ type: String, example: 'First Sync' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'bronze' })
  tier!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'spark' })
  iconKey!: string | null;

  @ApiProperty({ type: String, example: '2026-05-18T12:00:00.000Z' })
  earnedAt!: string;
}

export class DashboardSessionResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Demo Complete Quest' })
  gameName!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  gameIconUrl!: string | null;

  @ApiProperty({ type: String, example: 'Co-op completion run' })
  title!: string;

  @ApiProperty({ type: String, example: 'open' })
  status!: string;

  @ApiProperty({ type: String, example: '2026-05-20T12:00:00.000Z' })
  scheduledStartAt!: string;

  @ApiProperty({ type: Number, example: 4 })
  maxParticipants!: number;

  @ApiProperty({ type: Number, example: 2 })
  participantCount!: number;

  @ApiProperty({ type: Number, example: 3 })
  achievementCount!: number;
}

export class DashboardSessionsResponseDto {
  @ApiProperty({ type: [DashboardSessionResponseDto] })
  hosted!: DashboardSessionResponseDto[];

  @ApiProperty({ type: [DashboardSessionResponseDto] })
  joined!: DashboardSessionResponseDto[];

  @ApiProperty({ type: [DashboardSessionResponseDto] })
  upcomingForOwnedGames!: DashboardSessionResponseDto[];
}

export class DashboardGuideResponseDto {
  @ApiProperty({ type: String, example: '3dd0928a-28f6-4e9b-a5ad-164d536b8d95' })
  id!: string;

  @ApiProperty({ type: Number, example: 910001 })
  steamAppId!: number;

  @ApiProperty({ type: String, example: 'Demo Complete Quest' })
  gameName!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  gameIconUrl!: string | null;

  @ApiProperty({ type: String, example: '100% Roadmap' })
  title!: string;

  @ApiProperty({ type: String, example: '100-roadmap' })
  slug!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Route overview.' })
  summary!: string | null;

  @ApiProperty({ type: String, example: 'published' })
  status!: string;

  @ApiProperty({ type: String, example: 'public' })
  visibility!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-05-18T12:00:00.000Z' })
  publishedAt!: string | null;
}

export class DashboardGuidesResponseDto {
  @ApiProperty({ type: [DashboardGuideResponseDto] })
  authored!: DashboardGuideResponseDto[];

  @ApiProperty({ type: [DashboardGuideResponseDto] })
  suggested!: DashboardGuideResponseDto[];
}

export class DashboardDataQualityResponseDto {
  @ApiProperty({ type: Number, example: 2 })
  metadataOnlyGames!: number;

  @ApiProperty({ type: Number, example: 4 })
  notSyncedGames!: number;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-05-18T12:00:00.000Z' })
  lastSyncAt!: string | null;

  @ApiProperty({ type: [DashboardGameRefResponseDto] })
  metadataOnlyExamples!: DashboardGameRefResponseDto[];

  @ApiProperty({ type: [DashboardGameRefResponseDto] })
  notSyncedExamples!: DashboardGameRefResponseDto[];
}

export class DashboardActiveTargetsResponseDto {
  @ApiProperty({ type: [AccountTargetResponseDto] })
  games!: AccountTargetResponseDto[];

  @ApiProperty({ type: [AccountTargetResponseDto] })
  achievements!: AccountTargetResponseDto[];
}

export class MyDashboardResponseDto {
  @ApiProperty({ enum: DashboardStatusDto, example: DashboardStatusDto.Ready })
  status!: DashboardStatusDto;

  @ApiProperty({ type: DashboardViewerResponseDto })
  viewer!: DashboardViewerResponseDto;

  @ApiPropertyOptional({ type: DashboardProfileResponseDto, nullable: true })
  profile!: DashboardProfileResponseDto | null;

  @ApiProperty({ type: DashboardSummaryResponseDto })
  summary!: DashboardSummaryResponseDto;

  @ApiProperty({ type: [DashboardSyncRunResponseDto] })
  latestSyncRuns!: DashboardSyncRunResponseDto[];

  @ApiProperty({ type: [DashboardNextTargetResponseDto] })
  nextTargets!: DashboardNextTargetResponseDto[];

  @ApiProperty({ type: DashboardActiveTargetsResponseDto })
  activeTargets!: DashboardActiveTargetsResponseDto;

  @ApiProperty({ type: [DashboardActivityResponseDto] })
  recentActivity!: DashboardActivityResponseDto[];

  @ApiProperty({ type: [DashboardMilestoneResponseDto] })
  milestones!: DashboardMilestoneResponseDto[];

  @ApiProperty({ type: [DashboardBadgeResponseDto] })
  badges!: DashboardBadgeResponseDto[];

  @ApiProperty({ type: DashboardSessionsResponseDto })
  sessions!: DashboardSessionsResponseDto;

  @ApiProperty({ type: DashboardGuidesResponseDto })
  guides!: DashboardGuidesResponseDto;

  @ApiProperty({ type: DashboardDataQualityResponseDto })
  dataQuality!: DashboardDataQualityResponseDto;
}
