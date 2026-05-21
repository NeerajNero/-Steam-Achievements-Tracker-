import type { StatusTone } from '@/components/ui/status-badge';

export type AchievementMetadataState =
  | 'metadata_only'
  | 'not_synced'
  | 'no_achievements'
  | 'unlock_state_synced';

export function getAchievementMetadataStateLabel(
  state: AchievementMetadataState,
): string {
  if (state === 'metadata_only') {
    return 'Metadata Only';
  }

  if (state === 'not_synced') {
    return 'Not Synced';
  }

  if (state === 'no_achievements') {
    return 'No Achievements';
  }

  return 'Unlock State Synced';
}

export function getAchievementMetadataStateDescription(
  state: AchievementMetadataState,
): string {
  if (state === 'metadata_only') {
    return 'Achievement metadata is stored, but Steam did not provide player unlock state.';
  }

  if (state === 'not_synced') {
    return 'Achievement metadata has not been synced for this game yet.';
  }

  if (state === 'no_achievements') {
    return 'This game is confirmed to have no achievements.';
  }

  return 'Player unlock state is available for completion tracking.';
}

export function getAchievementMetadataStateTone(
  state: AchievementMetadataState,
): StatusTone {
  if (state === 'unlock_state_synced') {
    return 'success';
  }

  if (state === 'no_achievements') {
    return 'info';
  }

  return 'warning';
}
