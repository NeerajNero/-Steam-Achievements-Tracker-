import { Injectable } from '@nestjs/common';

import {
  DashboardRepository,
  type DashboardDataQualityCounts,
  type DashboardProfileGameRow,
} from '../repositories/dashboard.repository';
import type { GuideWithAuthor } from '../repositories/guides.repository';
import type { SessionSummaryRow } from '../repositories/gaming-sessions.repository';

export type {
  DashboardDataQualityCounts,
  DashboardProfileGameRow,
} from '../repositories/dashboard.repository';

@Injectable()
export class DashboardDataService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async countDataQualityGames(
    profileId: string,
  ): Promise<DashboardDataQualityCounts> {
    return this.dashboardRepository.countDataQualityGames(profileId);
  }

  async findMetadataOnlyGames(
    profileId: string,
    limit: number,
  ): Promise<DashboardProfileGameRow[]> {
    return this.dashboardRepository.findMetadataOnlyGames(profileId, limit);
  }

  async findNotSyncedGames(
    profileId: string,
    limit: number,
  ): Promise<DashboardProfileGameRow[]> {
    return this.dashboardRepository.findNotSyncedGames(profileId, limit);
  }

  async findGuideSuggestionsForProfile(
    profileId: string,
    limit: number,
  ): Promise<GuideWithAuthor[]> {
    return this.dashboardRepository.findGuideSuggestionsForProfile(profileId, limit);
  }

  async findHostedSessionsForUser(
    userId: string,
    limit: number,
  ): Promise<SessionSummaryRow[]> {
    return this.dashboardRepository.findHostedSessionsForUser(userId, limit);
  }

  async findJoinedSessionsForUser(
    userId: string,
    limit: number,
  ): Promise<SessionSummaryRow[]> {
    return this.dashboardRepository.findJoinedSessionsForUser(userId, limit);
  }

  async findUpcomingOwnedSessions(
    profileId: string,
    limit: number,
  ): Promise<SessionSummaryRow[]> {
    return this.dashboardRepository.findUpcomingOwnedSessions(profileId, limit);
  }
}
