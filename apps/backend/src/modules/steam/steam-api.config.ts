import { SteamApiConfigError } from './steam-api.errors';

export const STEAM_API_CONFIG = Symbol('STEAM_API_CONFIG');
export const STEAM_API_FETCH = Symbol('STEAM_API_FETCH');

export interface SteamApiConfig {
  apiKey: string | null;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
}

export type SteamFetch = (url: string, init?: RequestInit) => Promise<Response>;

export function getSteamApiConfigFromEnv(): SteamApiConfig {
  return {
    apiKey: normalizeOptionalEnv(process.env.STEAM_API_KEY),
    baseUrl:
      normalizeOptionalEnv(process.env.STEAM_API_BASE_URL) ??
      'https://api.steampowered.com',
    timeoutMs: parsePositiveInteger(process.env.STEAM_API_TIMEOUT_MS, 10_000),
    maxRetries: parseNonNegativeInteger(process.env.STEAM_API_MAX_RETRIES, 2),
  };
}

export function createSteamFetch(): SteamFetch {
  if (typeof fetch !== 'function') {
    throw new SteamApiConfigError('Global fetch is not available in this Node runtime.');
  }

  return (url, init) => fetch(url, init);
}

function normalizeOptionalEnv(value: string | undefined): string | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

function parseNonNegativeInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }

  return fallback;
}
