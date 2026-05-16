const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEMO_STEAM_ID = '76561198000000000';
const DETAIL_APP_ID = 910002;

interface SmokeCheck {
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
    validate: (body) => expectItems(body),
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
    label: 'game detail',
    path: `/profiles/${DEMO_STEAM_ID}/games/${DETAIL_APP_ID}`,
    validate: (body) =>
      isRecord(body) && body.steamAppId === DETAIL_APP_ID
        ? String(body.name)
        : fail(),
  },
  {
    label: 'game achievements',
    path: `/profiles/${DEMO_STEAM_ID}/games/${DETAIL_APP_ID}/achievements`,
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

    if (!response.ok) {
      throw new Error(
        `${check.label} failed with HTTP ${response.status} ${response.statusText}`,
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
