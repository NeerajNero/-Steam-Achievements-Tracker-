import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { DashboardController } from './dashboard.controller';
import { DashboardStatusDto } from './dto/dashboard-response.dto';
import type { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  it('protects GET /dashboard/me with session auth', async () => {
    const service = {
      getMyDashboard: vi.fn(async () => ({
        status: DashboardStatusDto.Ready,
        viewer: { id: 'user-id', displayName: 'Hunter', avatarUrl: null },
        profile: null,
        summary: {
          totalGames: 0,
          completedGames: 0,
          totalAchievements: 0,
          unlockedAchievements: 0,
          remainingAchievements: 0,
          averageCompletionPercentage: 0,
        },
        latestSyncRuns: [],
        nextTargets: [],
        recentActivity: [],
        milestones: [],
        badges: [],
        sessions: { hosted: [], joined: [], upcomingForOwnedGames: [] },
        guides: { authored: [], suggested: [] },
        dataQuality: {
          metadataOnlyGames: 0,
          notSyncedGames: 0,
          lastSyncAt: null,
          metadataOnlyExamples: [],
          notSyncedExamples: [],
        },
      })),
    };
    const controller = new DashboardController(
      service as unknown as DashboardService,
    );
    const currentUser = createAuthenticatedUser();

    await expect(controller.getMyDashboard(currentUser)).resolves.toMatchObject({
      status: DashboardStatusDto.Ready,
    });
    expect(service.getMyDashboard).toHaveBeenCalledWith(currentUser);
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.getMyDashboard)).toEqual([
      SessionAuthGuard,
    ]);
  });
});

function createAuthenticatedUser(): AuthenticatedUserContext {
  return {
    userId: 'user-id',
    user: {
      id: 'user-id',
      displayName: 'Hunter',
      avatarUrl: null,
      role: 'user',
      status: 'active',
    },
    steamAccount: {
      steamId: '76561198000000000',
      steamProfileId: 'profile-id',
      personaName: 'Hunter',
      avatarUrl: null,
      isPrimary: true,
    },
    publicProfile: null,
  };
}
