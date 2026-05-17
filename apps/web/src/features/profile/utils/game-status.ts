import type { GameLibraryItemResponseDto } from '@steam-achievement/client-sdk';

export type ProfileGameStatusLabel =
  | 'completed'
  | 'incomplete'
  | 'metadata_only'
  | 'no_achievements'
  | 'not_synced';

export function getProfileGameStatus(
  game: GameLibraryItemResponseDto,
): ProfileGameStatusLabel {
  if (game.achievementDataState === 'not_synced') {
    return 'not_synced';
  }

  if (game.achievementDataState === 'metadata_only') {
    return 'metadata_only';
  }

  if (game.achievementDataState === 'no_achievements') {
    return 'no_achievements';
  }

  if (game.completionPercentage >= 100) {
    return 'completed';
  }

  return 'incomplete';
}

export function formatProfileGameStatusLabel(
  status: ProfileGameStatusLabel,
): string {
  if (status === 'no_achievements') {
    return 'No Achievements';
  }

  if (status === 'metadata_only') {
    return 'Metadata Available';
  }

  if (status === 'not_synced') {
    return 'Metadata Not Synced';
  }

  return status === 'completed' ? 'Completed' : 'Incomplete';
}
