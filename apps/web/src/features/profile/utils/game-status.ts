import type { GameLibraryItemResponseDto } from '@steam-achievement/client-sdk';

export type ProfileGameStatusLabel = 'completed' | 'incomplete' | 'no_achievements';

export function getProfileGameStatus(
  game: GameLibraryItemResponseDto,
): ProfileGameStatusLabel {
  if (!game.hasAchievements || game.totalAchievements === 0) {
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

  return status === 'completed' ? 'Completed' : 'Incomplete';
}
