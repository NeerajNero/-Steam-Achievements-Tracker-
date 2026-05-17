import { describe, expect, it } from 'vitest';

import { formatSyncMetadata } from './sync-metadata';

describe('sync metadata formatting', () => {
  it('formats known counters and failure indicators', () => {
    expect(
      formatSyncMetadata({
        gamesRequested: 10,
        gamesProcessed: 8,
        gamesSucceeded: 4,
        gamesMetadataOnly: 2,
        gamesNoAchievements: 1,
        gamesFailed: 1,
        achievementsSynced: 13,
        profileAchievementsSynced: 9,
        unlockStateUnavailableApps: [{ appId: 550, reason: 'Player achievements unavailable' }],
        failedApps: [{ appId: 123, reason: 'Steam unavailable' }],
      }),
    ).toBe(
      'Games requested: 10 • Games processed: 8 • Succeeded: 4 • Metadata-only: 2 • No achievements: 1 • Failed games: 1 • Profile achievement rows: 9 • Achievement rows: 13 • Failed apps: 1 • Unlock-state unavailable: 1',
    );
  });

  it('falls back to none message for unknown metadata', () => {
    expect(formatSyncMetadata({ unrelated: true })).toBe('No metadata summary');
  });
});
