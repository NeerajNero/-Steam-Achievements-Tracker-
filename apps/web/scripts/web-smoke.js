const WEB_BASE_URL = process.env.WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

const DEMO_STEAM_ID = '76561198000000000';
const DEMO_GAME_ID = '910001';

const checks = [
  {
    path: '/',
    marker: 'Track completions',
    label: 'home page',
  },
  {
    path: `/profiles/${DEMO_STEAM_ID}`,
    marker: 'Nearest Completions',
    label: 'demo profile page',
  },
  {
    path: `/profiles/${DEMO_STEAM_ID}`,
    marker: 'Recent milestones',
    label: 'demo profile milestones section',
  },
  {
    path: `/profiles/${DEMO_STEAM_ID}`,
    marker: 'Badges',
    label: 'demo profile badges section',
  },
  {
    path: '/badges',
    marker: 'Steam Badges',
    label: 'badges page',
  },
  {
    path: `/profiles/${DEMO_STEAM_ID}/games/${DEMO_GAME_ID}`,
    marker: 'Back to profile',
    label: 'demo game detail page',
  },
  {
    path: '/games',
    marker: 'Steam Games',
    label: 'global games page',
  },
  {
    path: `/games/${DEMO_GAME_ID}`,
    marker: 'Global Steam Game',
    label: 'global game detail page',
  },
  {
    path: `/games/${DEMO_GAME_ID}/guides`,
    marker: 'Steam game guides',
    label: 'game guides page',
  },
  {
    path: `/games/${DEMO_GAME_ID}/guides/new`,
    marker: 'Create guide',
    label: 'new guide page',
  },
  {
    path: '/sessions',
    marker: 'Steam sessions',
    label: 'global sessions page',
  },
  {
    path: '/activity',
    marker: 'Steam Activity',
    label: 'activity page',
  },
  {
    path: `/games/${DEMO_GAME_ID}/sessions`,
    marker: 'Game sessions',
    label: 'game sessions page',
  },
  {
    path: `/games/${DEMO_GAME_ID}/sessions/new`,
    marker: 'New session',
    label: 'new session page',
  },
  {
    path: '/account/guides',
    marker: 'Your guides',
    label: 'account guides page',
  },
  {
    path: '/leaderboards',
    marker: 'Steam Leaderboards',
    label: 'leaderboards page',
  },
  {
    path: '/leaderboards/completion_percentage',
    marker: 'Completion Percentage',
    label: 'completion leaderboard page',
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

const publicProfileSlug = process.env.WEB_PUBLIC_PROFILE_SLUG;
const guideSlug = process.env.WEB_GUIDE_SLUG;
const sessionId = process.env.WEB_SESSION_ID;

if (publicProfileSlug !== undefined && publicProfileSlug.length > 0) {
  checks.push({
    path: `/u/${encodeURIComponent(publicProfileSlug)}`,
    marker: 'Public profile:',
    label: 'configured public profile page',
  });
}

if (guideSlug !== undefined && guideSlug.length > 0) {
  checks.push({
    path: `/games/${DEMO_GAME_ID}/guides/${encodeURIComponent(guideSlug)}`,
    marker: 'Loading guide...',
    label: 'configured guide detail page',
  });
}

if (sessionId !== undefined && sessionId.length > 0) {
  checks.push({
    path: `/sessions/${encodeURIComponent(sessionId)}`,
    marker: 'Loading session...',
    label: 'configured session detail page',
  });
}

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
