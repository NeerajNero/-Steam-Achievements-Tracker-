export type AccountPreferenceSettings = Partial<{
  defaultGameSort: 'completion' | 'name' | 'playtime' | 'recently_played' | 'remaining';
  defaultGameOrder: 'asc' | 'desc';
  showPrivateHints: boolean;
}>;

export type PublicProfileSettings = Partial<{
  showRarestAchievements: boolean;
  showRecentSyncs: boolean;
  showSteamId: boolean;
}>;

export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function validatePublicSlug(value: string): string | null {
  const slug = normalizeSlug(value);

  if (slug.length === 0) {
    return null;
  }

  if (!/^[a-z0-9-]{3,64}$/.test(slug)) {
    return 'Use 3 to 64 lowercase letters, numbers, or hyphens.';
  }

  if (
    [
      'admin',
      'api',
      'auth',
      'account',
      'profiles',
      'games',
      'settings',
      'docs',
      'health',
    ].includes(slug)
  ) {
    return 'This slug is reserved.';
  }

  return null;
}

export function asAccountPreferenceSettings(
  value: object,
): AccountPreferenceSettings {
  const record = value as Record<string, unknown>;

  return {
    defaultGameSort: isDefaultGameSort(record.defaultGameSort)
      ? record.defaultGameSort
      : undefined,
    defaultGameOrder:
      record.defaultGameOrder === 'asc' || record.defaultGameOrder === 'desc'
        ? record.defaultGameOrder
        : undefined,
    showPrivateHints:
      typeof record.showPrivateHints === 'boolean'
        ? record.showPrivateHints
        : undefined,
  };
}

export function asPublicProfileSettings(value: object): PublicProfileSettings {
  const record = value as Record<string, unknown>;

  return {
    showRarestAchievements:
      typeof record.showRarestAchievements === 'boolean'
        ? record.showRarestAchievements
        : undefined,
    showRecentSyncs:
      typeof record.showRecentSyncs === 'boolean'
        ? record.showRecentSyncs
        : undefined,
    showSteamId:
      typeof record.showSteamId === 'boolean' ? record.showSteamId : undefined,
  };
}

function isDefaultGameSort(
  value: unknown,
): value is NonNullable<AccountPreferenceSettings['defaultGameSort']> {
  return (
    value === 'completion' ||
    value === 'name' ||
    value === 'playtime' ||
    value === 'recently_played' ||
    value === 'remaining'
  );
}
