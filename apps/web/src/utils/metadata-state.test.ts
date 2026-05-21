import { describe, expect, it } from 'vitest';

import {
  getAchievementMetadataStateDescription,
  getAchievementMetadataStateLabel,
  getAchievementMetadataStateTone,
} from './metadata-state';

describe('metadata state helpers', () => {
  it('keeps metadata-only separate from locked/no-achievements language', () => {
    expect(getAchievementMetadataStateLabel('metadata_only')).toBe('Metadata Only');
    expect(getAchievementMetadataStateDescription('metadata_only')).toContain(
      'did not provide player unlock state',
    );
  });

  it('keeps not-synced separate from no-achievements language', () => {
    expect(getAchievementMetadataStateLabel('not_synced')).toBe('Not Synced');
    expect(getAchievementMetadataStateLabel('no_achievements')).toBe(
      'No Achievements',
    );
  });

  it('assigns stable badge tones', () => {
    expect(getAchievementMetadataStateTone('unlock_state_synced')).toBe('success');
    expect(getAchievementMetadataStateTone('metadata_only')).toBe('warning');
    expect(getAchievementMetadataStateTone('no_achievements')).toBe('info');
  });
});
