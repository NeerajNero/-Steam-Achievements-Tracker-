function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isArrayOfObjects(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value);
}

function readNumber(summary: Record<string, unknown>, key: string): number | null {
  const value = summary[key];

  if (typeof value === 'number') {
    return value;
  }

  return null;
}

export function formatSyncMetadata(metadata: unknown): string {
  if (!isObject(metadata)) {
    return 'No metadata summary';
  }

  const lines: string[] = [];

  const requested = readNumber(metadata, 'gamesRequested');
  if (requested !== null) {
    lines.push(`Games requested: ${requested}`);
  }

  const processed = readNumber(metadata, 'gamesProcessed');
  if (processed !== null) {
    lines.push(`Games processed: ${processed}`);
  }

  const succeeded = readNumber(metadata, 'gamesSucceeded');
  if (succeeded !== null) {
    lines.push(`Succeeded: ${succeeded}`);
  }

  const metadataOnly = readNumber(metadata, 'gamesMetadataOnly');
  if (metadataOnly !== null) {
    lines.push(`Metadata-only: ${metadataOnly}`);
  }

  const noAchievements = readNumber(metadata, 'gamesNoAchievements');
  if (noAchievements !== null) {
    lines.push(`No achievements: ${noAchievements}`);
  }

  const failed = readNumber(metadata, 'gamesFailed');
  if (failed !== null) {
    lines.push(`Failed games: ${failed}`);
  }

  const profileAchievementSynced = readNumber(metadata, 'profileAchievementsSynced');
  if (profileAchievementSynced !== null) {
    lines.push(`Profile achievement rows: ${profileAchievementSynced}`);
  }

  const achievementsSynced = readNumber(metadata, 'achievementsSynced');
  if (achievementsSynced !== null) {
    lines.push(`Achievement rows: ${achievementsSynced}`);
  }

  if (isArrayOfObjects(metadata.failedApps) && metadata.failedApps.length > 0) {
    lines.push(`Failed apps: ${metadata.failedApps.length}`);
  }

  if (
    isArrayOfObjects(metadata.unlockStateUnavailableApps) &&
    metadata.unlockStateUnavailableApps.length > 0
  ) {
    lines.push(`Unlock-state unavailable: ${metadata.unlockStateUnavailableApps.length}`);
  }

  return lines.length > 0 ? lines.join(' • ') : 'No metadata summary';
}

