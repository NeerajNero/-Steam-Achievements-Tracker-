import type { GameLibraryItemResponseDto } from '@steam-achievement/client-sdk';

export function getRecentProfileGames(
  items: readonly GameLibraryItemResponseDto[] | undefined,
): readonly GameLibraryItemResponseDto[] {
  return (
    items?.filter(
      (game) => game.playtimeTwoWeeksMinutes > 0 || game.lastPlayedAt !== null,
    ) ?? []
  );
}
