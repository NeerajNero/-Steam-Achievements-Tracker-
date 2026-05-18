import {
  DashboardGameRefResponseDtoAchievementDataStateEnum,
  type DashboardDataQualityResponseDto,
} from '@steam-achievement/client-sdk';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DashboardGuides } from './dashboard-guides';
import { DashboardSessions } from './dashboard-sessions';
import { DashboardSignInPrompt } from './dashboard-sign-in-prompt';
import { NextTargets } from './next-targets';
import { SyncAttention } from './sync-attention';

describe('dashboard empty states', () => {
  it('renders the unauthenticated sign-in prompt', () => {
    const html = renderToStaticMarkup(
      <DashboardSignInPrompt signInUrl="/auth/steam/login?returnTo=%2Fdashboard" />,
    );

    expect(html).toContain('Sign in with Steam to open your command center.');
    expect(html).toContain('Sign in with Steam');
  });

  it('renders empty target, session, and guide states', () => {
    expect(renderToStaticMarkup(<NextTargets targets={[]} />)).toContain(
      'No targets yet. Sync achievements to find close completions.',
    );
    expect(
      renderToStaticMarkup(
        <DashboardSessions hosted={[]} joined={[]} upcomingForOwnedGames={[]} />,
      ),
    ).toContain('No joined sessions yet. Browse upcoming sessions.');
    expect(
      renderToStaticMarkup(<DashboardGuides authored={[]} suggested={[]} />),
    ).toContain('No guide suggestions yet. Sync games or browse guides.');
  });

  it('renders a clean data-quality state when no games need attention', () => {
    const dataQuality = {
      metadataOnlyGames: 0,
      notSyncedGames: 0,
      metadataOnlyExamples: [],
      notSyncedExamples: [],
      lastSyncAt: undefined,
    } satisfies DashboardDataQualityResponseDto;

    expect(
      renderToStaticMarkup(
        <SyncAttention dataQuality={dataQuality} steamId="76561198000000000" />,
      ),
    ).toContain('No metadata-only or not-synced games are currently flagged.');
  });

  it('renders metadata-only and not-synced attention labels', () => {
    const dataQuality = {
      metadataOnlyGames: 1,
      notSyncedGames: 1,
      metadataOnlyExamples: [
        {
          steamAppId: 10,
          name: 'Metadata Game',
          totalAchievements: 10,
          unlockedAchievements: 0,
          remainingAchievements: 10,
          completionPercentage: 0,
          achievementDataState:
            DashboardGameRefResponseDtoAchievementDataStateEnum.MetadataOnly,
          playtimeMinutes: 30,
          playtimeTwoWeeksMinutes: 0,
        },
      ],
      notSyncedExamples: [
        {
          steamAppId: 20,
          name: 'Unsynced Game',
          totalAchievements: 0,
          unlockedAchievements: 0,
          remainingAchievements: 0,
          completionPercentage: 0,
          achievementDataState:
            DashboardGameRefResponseDtoAchievementDataStateEnum.NotSynced,
          playtimeMinutes: 15,
          playtimeTwoWeeksMinutes: 0,
        },
      ],
      lastSyncAt: undefined,
    } satisfies DashboardDataQualityResponseDto;

    const html = renderToStaticMarkup(
      <SyncAttention dataQuality={dataQuality} steamId="76561198000000000" />,
    );

    expect(html).toContain(
      'Achievement metadata is available, but Steam did not provide unlock state.',
    );
    expect(html).toContain(
      'Achievement metadata has not been synced for this game yet.',
    );
    expect(html).toContain('Metadata Game');
    expect(html).toContain('Unsynced Game');
  });
});
