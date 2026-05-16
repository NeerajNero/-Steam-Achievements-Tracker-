const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEFAULT_TIMEOUT_SECONDS = 300;
const DEFAULT_POLL_INTERVAL_MS = 2_000;

const TERMINAL_STATUSES = new Set(['success', 'partial_success', 'failed']);

type SyncScope = 'profile' | 'games' | 'achievements';

interface QueuedSyncResponse {
  syncRunId: string;
  jobId: string;
  steamId: string;
  scope: SyncScope;
  status: 'queued';
  queuedAt: string;
}

interface SyncRunSummary {
  id: string;
  syncType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  metadata: unknown;
}

interface SyncHistoryResponse {
  steamId: string;
  items: SyncRunSummary[];
}

interface SmokeOptions {
  baseUrl: string;
  steamId: string;
  appIds?: number[];
  syncAllAchievements: boolean;
  timeoutMs: number;
  pollIntervalMs: number;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2), process.env);
  console.log(`Real sync smoke target: ${options.steamId}`);
  console.log(`Backend API: ${options.baseUrl}`);

  await enqueueAndWait(options, 'profile');
  await enqueueAndWait(options, 'games');

  if (options.appIds !== undefined) {
    await enqueueAndWait(options, 'achievements', options.appIds);
  } else if (options.syncAllAchievements) {
    await enqueueAndWait(options, 'achievements');
  } else {
    console.log(
      'Achievement sync skipped. Pass --app-ids=APP_ID[,APP_ID] for selected games or --all-achievements for every stored game.',
    );
  }
}

async function enqueueAndWait(
  options: SmokeOptions,
  scope: SyncScope,
  appIds?: number[],
): Promise<void> {
  const queued = await enqueueSync(options, scope, appIds);
  console.log(
    `${scope}: queued syncRunId=${queued.syncRunId} jobId=${queued.jobId}`,
  );

  const result = await waitForSyncRun(options, queued.syncRunId);
  const metadata = JSON.stringify(result.metadata);
  const errorMessage =
    result.errorMessage === null ? 'none' : sanitizeLine(result.errorMessage);

  console.log(
    `${scope}: status=${result.status} syncRunId=${result.id} finishedAt=${result.finishedAt ?? 'pending'} error=${errorMessage} metadata=${metadata}`,
  );

  if (result.status === 'failed') {
    throw new Error(`${scope} sync failed. See sync_runs for details.`);
  }
}

async function enqueueSync(
  options: SmokeOptions,
  scope: SyncScope,
  appIds?: number[],
): Promise<QueuedSyncResponse> {
  const body = appIds === undefined ? { scope } : { scope, appIds };
  const response = await fetch(
    `${options.baseUrl}/profiles/${options.steamId}/sync`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  const json = await readJsonOrThrow(response, `enqueue ${scope}`);

  if (!isQueuedSyncResponse(json)) {
    throw new Error(`Unexpected queued sync response for ${scope}.`);
  }

  return json;
}

async function waitForSyncRun(
  options: SmokeOptions,
  syncRunId: string,
): Promise<SyncRunSummary> {
  const deadline = Date.now() + options.timeoutMs;

  while (Date.now() <= deadline) {
    const history = await getSyncHistory(options);
    const run = history.items.find((item) => item.id === syncRunId);

    if (run !== undefined && TERMINAL_STATUSES.has(run.status)) {
      return run;
    }

    await sleep(options.pollIntervalMs);
  }

  throw new Error(`Timed out waiting for syncRunId=${syncRunId}.`);
}

async function getSyncHistory(
  options: SmokeOptions,
): Promise<SyncHistoryResponse> {
  const response = await fetch(
    `${options.baseUrl}/profiles/${options.steamId}/sync-runs?limit=10`,
  );
  const json = await readJsonOrThrow(response, 'poll sync runs');

  if (!isSyncHistoryResponse(json)) {
    throw new Error('Unexpected sync history response.');
  }

  return json;
}

async function readJsonOrThrow(
  response: Response,
  label: string,
): Promise<unknown> {
  const text = await response.text();
  const body = parseJson(text);

  if (!response.ok) {
    const detail = isRecord(body) && typeof body.message === 'string'
      ? body.message
      : response.statusText;
    throw new Error(`${label} failed with HTTP ${response.status}: ${detail}`);
  }

  return body;
}

function parseOptions(
  args: string[],
  env: NodeJS.ProcessEnv,
): SmokeOptions {
  const positionalSteamId = args.find((arg) => !arg.startsWith('--'));
  const steamId =
    positionalSteamId ?? env.STEAM_SMOKE_STEAM_ID ?? env.STEAM_ID ?? null;

  if (steamId === null || steamId.trim() === '') {
    throw new Error(
      'Provide a Steam64 ID as an argument or STEAM_SMOKE_STEAM_ID.',
    );
  }

  const baseUrl = (
    getFlagValue(args, '--base-url') ??
    env.API_BASE_URL ??
    DEFAULT_API_BASE_URL
  ).replace(/\/$/, '');
  const appIds = parseAppIds(
    getFlagValue(args, '--app-ids') ?? env.STEAM_SMOKE_APP_IDS,
  );
  const syncAllAchievements =
    args.includes('--all-achievements') ||
    env.STEAM_SMOKE_ALL_ACHIEVEMENTS === 'true';
  const timeoutSeconds = parsePositiveInteger(
    getFlagValue(args, '--timeout-seconds') ??
      env.STEAM_SMOKE_TIMEOUT_SECONDS,
    DEFAULT_TIMEOUT_SECONDS,
  );

  return {
    baseUrl,
    steamId,
    appIds,
    syncAllAchievements,
    timeoutMs: timeoutSeconds * 1_000,
    pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
  };
}

function getFlagValue(args: string[], flag: string): string | undefined {
  const prefix = `${flag}=`;
  const match = args.find((arg) => arg.startsWith(prefix));

  return match === undefined ? undefined : match.slice(prefix.length);
}

function parseAppIds(value: string | undefined): number[] | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  const appIds = value.split(',').map((part) => Number(part.trim()));

  if (
    appIds.length === 0 ||
    appIds.length > 100 ||
    appIds.some((appId) => !Number.isInteger(appId) || appId < 1)
  ) {
    throw new Error('App IDs must be 1 to 100 positive integers.');
  }

  return [...new Set(appIds)];
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('Timeout must be a positive integer number of seconds.');
  }

  return parsed;
}

function parseJson(value: string): unknown {
  if (value.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function isQueuedSyncResponse(value: unknown): value is QueuedSyncResponse {
  return (
    isRecord(value) &&
    typeof value.syncRunId === 'string' &&
    typeof value.jobId === 'string' &&
    typeof value.steamId === 'string' &&
    isSyncScope(value.scope) &&
    value.status === 'queued' &&
    typeof value.queuedAt === 'string'
  );
}

function isSyncHistoryResponse(value: unknown): value is SyncHistoryResponse {
  return (
    isRecord(value) &&
    typeof value.steamId === 'string' &&
    Array.isArray(value.items) &&
    value.items.every(isSyncRunSummary)
  );
}

function isSyncRunSummary(value: unknown): value is SyncRunSummary {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.syncType === 'string' &&
    typeof value.status === 'string' &&
    typeof value.startedAt === 'string' &&
    (typeof value.finishedAt === 'string' || value.finishedAt === null) &&
    (typeof value.errorMessage === 'string' || value.errorMessage === null)
  );
}

function isSyncScope(value: unknown): value is SyncScope {
  return value === 'profile' || value === 'games' || value === 'achievements';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeLine(value: string): string {
  return value.replaceAll('\n', ' ').replaceAll('\r', ' ');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? sanitizeLine(error.message) : 'Unknown smoke error';
  console.error(`Real sync smoke failed: ${message}`);
  process.exitCode = 1;
});

export {};
