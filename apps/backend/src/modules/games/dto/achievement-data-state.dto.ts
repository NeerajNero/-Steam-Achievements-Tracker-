export const ACHIEVEMENT_DATA_STATES = [
  'not_synced',
  'no_achievements',
  'metadata_only',
  'unlock_state_synced',
] as const;

export type AchievementDataState = (typeof ACHIEVEMENT_DATA_STATES)[number];
