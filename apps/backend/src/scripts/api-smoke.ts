const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEMO_STEAM_ID = '76561198000000000';
const DETAIL_APP_ID = 910002;
const GLOBAL_DETAIL_APP_ID = 910001;

interface SmokeCheck {
  expectedStatus?: number;
  label: string;
  path: string;
  validate: (body: unknown) => string;
}

const checks: SmokeCheck[] = [
  {
    label: 'health',
    path: '/health',
    validate: (body) => (isRecord(body) && body.status === 'ok' ? 'ok' : fail()),
  },
  {
    expectedStatus: 401,
    label: 'dashboard requires auth',
    path: '/dashboard/me',
    validate: (body) => expectUnauthorized(body),
  },
  {
    expectedStatus: 401,
    label: 'targets require auth',
    path: '/account/targets',
    validate: (body) => expectUnauthorized(body),
  },
  {
    label: 'profile',
    path: `/profiles/${DEMO_STEAM_ID}`,
    validate: (body) => expectField(body, 'steamId', DEMO_STEAM_ID),
  },
  {
    label: 'summary',
    path: `/profiles/${DEMO_STEAM_ID}/summary`,
    validate: (body) =>
      isRecord(body) && typeof body.totalGames === 'number'
        ? `${body.totalGames} games`
        : fail(),
  },
  {
    label: 'games',
    path: `/profiles/${DEMO_STEAM_ID}/games`,
    validate: (body) => expectProfileGamesWithPlaytime(body),
  },
  {
    label: 'completed games',
    path: `/profiles/${DEMO_STEAM_ID}/games?status=completed`,
    validate: (body) => expectItems(body),
  },
  {
    label: 'nearest completions',
    path: `/profiles/${DEMO_STEAM_ID}/games/nearest-completions`,
    validate: (body) => expectItems(body),
  },
  {
    label: 'rarest achievements',
    path: `/profiles/${DEMO_STEAM_ID}/achievements/rarest`,
    validate: (body) => expectItems(body),
  },
  {
    label: 'sync runs',
    path: `/profiles/${DEMO_STEAM_ID}/sync-runs`,
    validate: (body) => expectItems(body),
  },
  {
    label: 'profile snapshots',
    path: `/profiles/${DEMO_STEAM_ID}/snapshots?limit=5`,
    validate: (body) => expectItems(body),
  },
  {
    label: 'profile milestones',
    path: `/profiles/${DEMO_STEAM_ID}/milestones?limit=5`,
    validate: (body) => expectItems(body),
  },
  {
    label: 'profile badges',
    path: `/profiles/${DEMO_STEAM_ID}/badges`,
    validate: (body) => expectItems(body),
  },
  {
    label: 'profile showcase',
    path: `/profiles/${DEMO_STEAM_ID}/showcase`,
    validate: (body) => expectCollection(body),
  },
  {
    label: 'badge definitions',
    path: '/badges',
    validate: (body) => expectItems(body),
  },
  {
    label: 'profile activity',
    path: `/profiles/${DEMO_STEAM_ID}/activity?limit=5`,
    validate: (body) => expectCollection(body),
  },
  {
    label: 'game detail',
    path: `/profiles/${DEMO_STEAM_ID}/games/${DETAIL_APP_ID}`,
    validate: (body) =>
      isRecord(body) &&
      body.steamAppId === DETAIL_APP_ID &&
      typeof body.playtimeMinutes === 'number' &&
      typeof body.playtimeTwoWeeksMinutes === 'number' &&
      typeof body.achievementMetadataCount === 'number' &&
      typeof body.knownUnlockStateCount === 'number' &&
      typeof body.achievementDataState === 'string' &&
      ('lastPlayedAt' in body)
        ? String(body.name)
        : fail(),
  },
  {
    label: 'game achievements',
    path: `/profiles/${DEMO_STEAM_ID}/games/${DETAIL_APP_ID}/achievements`,
    validate: (body) => expectAchievementsWithUnlockState(body),
  },
  {
    label: 'global games',
    path: '/games?limit=5',
    validate: (body) => expectItems(body),
  },
  {
    label: 'global game detail',
    path: `/games/${GLOBAL_DETAIL_APP_ID}`,
    validate: (body) =>
      isRecord(body) &&
      isRecord(body.game) &&
      isRecord(body.stats) &&
      body.game.steamAppId === GLOBAL_DETAIL_APP_ID &&
      typeof body.game.achievementDataState === 'string' &&
      typeof body.stats.achievementMetadataCount === 'number'
        ? String(body.game.name)
        : fail(),
  },
  {
    label: 'global game achievements',
    path: `/games/${GLOBAL_DETAIL_APP_ID}/achievements?limit=5`,
    validate: (body) => expectItems(body),
  },
  {
    label: 'global game players',
    path: `/games/${GLOBAL_DETAIL_APP_ID}/players?limit=5`,
    validate: (body) => expectItems(body),
  },
  {
    label: 'game activity',
    path: `/games/${GLOBAL_DETAIL_APP_ID}/activity?limit=5`,
    validate: (body) => expectCollection(body),
  },
  {
    label: 'global activity',
    path: '/activity?limit=5',
    validate: (body) => expectCollection(body),
  },
  {
    label: 'game guides',
    path: `/games/${GLOBAL_DETAIL_APP_ID}/guides?limit=5`,
    validate: (body) => expectCollection(body),
  },
  {
    label: 'global sessions',
    path: '/sessions?limit=5',
    validate: (body) => expectCollection(body),
  },
  {
    label: 'game sessions',
    path: `/games/${GLOBAL_DETAIL_APP_ID}/sessions?limit=5`,
    validate: (body) => expectCollection(body),
  },
  {
    label: 'leaderboard types',
    path: '/leaderboards',
    validate: (body) => expectItems(body),
  },
  {
    label: 'completion leaderboard',
    path: '/leaderboards/completion_percentage?limit=5',
    validate: (body) => expectItems(body),
  },
];

async function main(): Promise<void> {
  const baseUrl = (process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/$/,
    '',
  );

  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`);
    const expectedStatus = check.expectedStatus ?? 200;

    if (response.status !== expectedStatus) {
      throw new Error(
        `${check.label} failed with HTTP ${response.status} ${response.statusText}; expected ${expectedStatus}`,
      );
    }

    const body: unknown = await response.json();
    console.log(`${check.label}: ${check.validate(body)}`);
  }
}

function expectField(body: unknown, field: string, expected: string): string {
  if (!isRecord(body) || body[field] !== expected) {
    return fail();
  }

  return expected;
}

function expectItems(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.items) || body.items.length === 0) {
    return fail();
  }

  return `${body.items.length} items`;
}

function expectProfileGamesWithPlaytime(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.items) || body.items.length === 0) {
    return fail();
  }

  const hasPlaytimeFields = body.items.every(
    (item) =>
      isRecord(item) &&
      typeof item.playtimeMinutes === 'number' &&
      typeof item.playtimeTwoWeeksMinutes === 'number' &&
      typeof item.achievementMetadataCount === 'number' &&
      typeof item.knownUnlockStateCount === 'number' &&
      typeof item.achievementDataState === 'string' &&
      'lastPlayedAt' in item,
  );

  if (!hasPlaytimeFields) {
    return fail();
  }

  const recentCount = body.items.filter(
    (item) => isRecord(item) && Number(item.playtimeTwoWeeksMinutes) > 0,
  ).length;
  return `${body.items.length} items, ${recentCount} recent`;
}

function expectAchievementsWithUnlockState(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.items) || body.items.length === 0) {
    return fail();
  }

  const unlockStates = new Set(
    body.items.map((item) => (isRecord(item) ? item.unlockState : undefined)),
  );

  if (
    ![...unlockStates].every(
      (value) => value === 'unlocked' || value === 'locked' || value === 'unknown',
    )
  ) {
    return fail();
  }

  return `${body.items.length} items, states=${[...unlockStates].join(',')}`;
}

function expectCollection(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    return fail();
  }

  return `${body.items.length} items`;
}

function expectUnauthorized(body: unknown): string {
  if (!isRecord(body) || body.statusCode !== 401) {
    return fail();
  }

  return '401';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function fail(): never {
  throw new Error('unexpected response body');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown smoke error';
  console.error(`API smoke failed: ${message}`);
  process.exitCode = 1;
});

export {};
