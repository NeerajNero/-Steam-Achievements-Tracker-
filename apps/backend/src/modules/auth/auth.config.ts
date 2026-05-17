export interface AuthConfig {
  authSessionCookieName: string;
  authStateCookieName: string;
  authSessionTtlDays: number;
  authStateTtlSeconds: number;
  authCookieSecure: boolean;
  backendPublicUrl: string;
  frontendPublicUrl: string;
}

export function getAuthConfig(): AuthConfig {
  return {
    authSessionCookieName: normalizeOptionalEnv(
      process.env.AUTH_SESSION_COOKIE_NAME,
      'steam_auth_session',
    ),
    authStateCookieName: normalizeOptionalEnv(
      process.env.AUTH_STATE_COOKIE_NAME,
      'steam_auth_state',
    ),
    authSessionTtlDays: parsePositiveInteger(
      process.env.AUTH_SESSION_TTL_DAYS,
      14,
    ),
    authStateTtlSeconds: parsePositiveInteger(
      process.env.AUTH_STATE_TTL_SECONDS,
      300,
    ),
    authCookieSecure: parseBoolean(process.env.AUTH_COOKIE_SECURE, false),
    backendPublicUrl: normalizeOptionalEnv(
      process.env.BACKEND_PUBLIC_URL,
      'http://localhost:3000',
    ),
    frontendPublicUrl: normalizeOptionalEnv(
      process.env.FRONTEND_PUBLIC_URL,
      'http://localhost:3001',
    ),
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  return value.trim().toLowerCase() === 'true';
}

function normalizeOptionalEnv(
  value: string | undefined,
  fallback: string,
): string {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  return value.trim();
}
