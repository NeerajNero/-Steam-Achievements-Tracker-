const WEB_BASE_URL = process.env.WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

const DEMO_STEAM_ID = '76561198000000000';
const DEMO_GAME_ID = '910001';

const checks = [
  {
    path: '/',
    marker: 'Steam Achievement Tracker',
    label: 'home page',
  },
  {
    path: `/profiles/${DEMO_STEAM_ID}`,
    marker: 'Nearest Completions',
    label: 'demo profile page',
  },
  {
    path: `/profiles/${DEMO_STEAM_ID}/games/${DEMO_GAME_ID}`,
    marker: 'Back to profile',
    label: 'demo game detail page',
  },
  {
    path: '/settings',
    marker: 'Manage your Steam-only account',
    label: 'settings page',
  },
  {
    path: '/u/local-smoke-missing',
    marker: 'Loading public profile',
    label: 'public profile slug page',
  },
];

async function checkPage(path, marker, label) {
  const url = `${WEB_BASE_URL}${path}`;
  const response = await fetchWithLocalhostFallback(url);

  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status} for ${url}`);
  }

  const text = await response.text();
  if (!text.includes(marker)) {
    throw new Error(`${label} missing expected marker "${marker}"`);
  }

  console.log(`ok ${label}: ${url}`);
}

async function fetchWithLocalhostFallback(url) {
  try {
    return await fetch(url);
  } catch (error) {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname !== 'localhost') {
      throw error;
    }

    parsedUrl.hostname = '127.0.0.1';
    return fetch(parsedUrl.toString());
  }
}

async function main() {
  for (const check of checks) {
    await checkPage(check.path, check.marker, check.label);
  }
}

main()
  .then(() => {
    console.log('web smoke checks passed');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
