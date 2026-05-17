import type { ProfileBadgeResponseDto } from '@steam-achievement/client-sdk';

const MAX_SHOWCASE_ITEMS = 6;

export function buildBadgeShowcaseItems(
  selectedProfileBadgeIds: string[],
  earnedBadges: ProfileBadgeResponseDto[],
) {
  const uniqueIds = Array.from(new Set(selectedProfileBadgeIds));

  if (uniqueIds.length > MAX_SHOWCASE_ITEMS) {
    throw new Error(`Choose at most ${MAX_SHOWCASE_ITEMS} showcase items.`);
  }

  const earnedIds = new Set(earnedBadges.map((badge) => badge.id));
  const invalidId = uniqueIds.find((id) => !earnedIds.has(id));

  if (invalidId !== undefined) {
    throw new Error('Showcase includes a badge this profile has not earned.');
  }

  return uniqueIds.map((id, index) => ({
    itemType: 'badge' as const,
    itemId: id,
    position: index,
    visibility: 'public' as const,
    titleOverride: null,
  }));
}
