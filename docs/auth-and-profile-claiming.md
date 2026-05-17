# Auth And Profile Claiming

This project is still local/dev only. Steam-only auth runtime is implemented
through backend-owned Sign in with Steam OpenID, server sessions, and automatic
Steam profile claiming/linking.

## Sign In With Steam Flow

Sign in with Steam is the only auth method for this project. There is no
email/password auth.

Runtime flow:

1. User signs in with Steam.
2. Backend verifies the Steam OpenID assertion server-side.
3. Backend prepares a raw session token in memory and hashes it.
4. Backend persists the Steam profile, app user, account link, preferences,
   public profile settings, and hashed session row in one database transaction.
5. Backend creates or updates an `app_users` row.
6. Backend ensures the Steam profile exists in `steam_profiles`.
7. Backend links the user and profile through `user_steam_accounts`.
8. Backend creates `user_preferences` and `public_profiles` rows if missing.
9. Backend sets an httpOnly session cookie and redirects to the frontend.

If callback persistence fails, the transaction rolls back. A failed callback
should not leave an orphan `app_users` row without a matching
`user_steam_accounts` row, and it should not leave an `auth_sessions` row
without a linked Steam account.

The OpenID login and callback endpoints are browser redirects owned by the
backend:

- `GET /auth/steam/login`
- `GET /auth/steam/callback`

The frontend reads auth state and logs out through the generated SDK:

- `GET /auth/me`
- `POST /auth/logout`

## Session Cookies

Session tokens are generated server-side. The raw session token is stored only
in the httpOnly cookie. PostgreSQL stores only
`auth_sessions.session_token_hash`, never the raw token.

Cookie defaults for local development:

- `AUTH_SESSION_COOKIE_NAME=steam_auth_session`
- `AUTH_STATE_COOKIE_NAME=steam_auth_state`
- `AUTH_SESSION_TTL_DAYS=14`
- `AUTH_STATE_TTL_SECONDS=300`
- `AUTH_COOKIE_SECURE=false`
- `BACKEND_PUBLIC_URL=http://localhost:3000`
- `FRONTEND_PUBLIC_URL=http://localhost:3001`

Use `AUTH_COOKIE_SECURE=true` for HTTPS production-like environments.

## Tables

- `app_users`: internal application users.
- `user_steam_accounts`: ownership links between app users and Steam profiles.
- `auth_sessions`: server-managed sessions. Stores hashed session tokens only,
  never raw session tokens.
- `user_preferences`: authenticated user settings.
- `public_profiles`: public publishing settings and future custom slug support.

## Separation From Steam Sync Data

Raw Steam sync data stays in the Steam domain tables:

- `steam_profiles`
- `games`
- `profile_games`
- `achievements`
- `profile_achievements`
- `sync_runs`

User ownership and public publishing settings are separate concerns. Claiming a
profile should not rewrite raw Steam metadata or achievement progress.

## Frontend Behavior

The frontend shows a minimal auth status control on public pages:

- unauthenticated users see `Sign in with Steam`;
- authenticated users see display name, linked Steam ID, a settings link, and a
  sign-out button.

Authenticated account settings are implemented at `/settings` with client-side
unauthenticated handling. Protected middleware and role-specific UI are deferred.

## Account Settings

Signed-in users can manage account display fields and settings through
generated-SDK endpoints:

- `GET /account/me`
- `PATCH /account/me`
- `GET /account/preferences`
- `PATCH /account/preferences`
- `GET /account/public-profile`
- `PATCH /account/public-profile`

Editable account fields are limited to display name and avatar URL. Role,
status, Steam ID, ownership links, session rows, and token fields are not
accepted in account update requests.

Preferences are strict JSON settings:

```json
{
  "defaultGameSort": "completion",
  "defaultGameOrder": "desc",
  "showPrivateHints": true
}
```

## Public Steam Profiles

Each claimed Steam profile has a `public_profiles` row for publishing controls.
Publishing settings are separate from raw Steam sync data.

Slug rules:
- slugs are trimmed and normalized to lowercase;
- valid slugs are 3 to 64 characters;
- valid characters are `a-z`, `0-9`, and hyphen;
- reserved slugs include `admin`, `api`, `auth`, `account`, `profiles`,
  `games`, `settings`, `docs`, and `health`;
- uniqueness is enforced by PostgreSQL and conflicts return `409`.

Public profile settings currently include:

```json
{
  "showRarestAchievements": true,
  "showRecentSyncs": true,
  "showSteamId": true
}
```

Published profiles are read through `GET /public-profiles/:slug` and rendered in
the frontend at `/u/:slug`. The public response contains public Steam metadata,
summary stats, nearest completions, and rarest achievements when enabled. It
does not expose private account fields, user preferences, sessions, token
hashes, cookies, or internal auth details.

Post-auth Steam sync still depends on backend Steam API runtime config. For
local Docker, `STEAM_API_KEY` belongs in `apps/backend/.env`, and the backend
container should pass:

```sh
docker-compose exec -T backend pnpm steam:config-check
```

If the authenticated sync run reports `STEAM_API_KEY is not configured in
backend runtime environment.`, recreate the backend container after fixing the
local env file:

```sh
docker-compose up -d --force-recreate backend
```

## Manual Login Smoke

Run the local stack, then open:

```txt
http://localhost:3001
```

Expected flow:

1. `/auth/me` returns `401` before login.
2. Clear localhost auth cookies or use a private browser window when retrying a
   failed callback.
3. Click `Sign in with Steam`.
4. Complete Steam login in the browser.
5. Backend handles `/auth/steam/callback` and redirects back to the frontend.
6. The frontend URL does not include `auth_error`.
7. `AuthStatus` shows the signed-in user and linked Steam ID.
8. A session cookie exists in the browser with `HttpOnly`, `SameSite=Lax`, and
   no `Secure` flag for local HTTP development.
9. PostgreSQL has rows in `app_users`, `steam_profiles`,
   `user_steam_accounts`, `user_preferences`, `public_profiles`, and
   `auth_sessions`.
10. `auth_sessions.session_token_hash` is populated, but the raw token is not
   stored in PostgreSQL.
11. Click `Sign out`.
12. The session row has `revoked_at` set, the cookie is cleared/expired, and
    `/auth/me` returns `401` again.

Do not print cookie values, raw session tokens, OpenID callback URLs, OpenID
assertion payloads, or `session_token_hash` while testing.

## Return Path Safety

`returnTo` accepts local frontend paths such as
`/profiles/76561198000000000`. External URLs are normalized to `/` to avoid open
redirects. The callback path re-normalizes the stored value before redirecting
as defense in depth.

## Callback Diagnostics

The Steam OpenID callback reports safe reason codes instead of a generic error.
The frontend redirect may include:

```txt
?auth_error=<reason_code>
```

Current reason codes:

- `auth_state_missing`: the local httpOnly state cookie is absent or expired.
- `auth_state_invalid`: the callback state does not match the stored state.
- `openid_missing_required_fields`: Steam did not return the required OpenID
  fields.
- `openid_cancelled`: the user cancelled the Steam login.
- `openid_verification_failed`: Steam verification completed but rejected the
  assertion.
- `openid_verification_request_failed`: the backend could not complete the
  server-side verification request to Steam.
- `steam_id_extract_failed`: the claimed identity did not contain a valid
  SteamID64.
- `steam_profile_upsert_failed`: the Steam profile row could not be created or
  updated.
- `app_user_link_failed`: user/account/profile-claim rows could not be created
  or linked. For local troubleshooting, check for stale orphan `app_users` rows
  from older non-transactional callback attempts and clean only orphan auth
  rows as described in operations docs.
- `session_create_failed`: the session row or session cookie could not be
  created.
- `callback_unexpected_error`: an unexpected callback failure occurred.

Backend callback logs use safe event names such as `callback_started`,
`state_verified`, `openid_fields_present`, `openid_verified`,
`steam_id_extracted`, `profile_claimed`, `session_created`,
`callback_redirecting`, and `callback_failed`. Logs must not include raw OpenID
query payloads, cookie values, raw session tokens, or token hashes.

Local auth must use one browser-facing host consistently. Use
`http://localhost:3000` for `BACKEND_PUBLIC_URL` and
`http://localhost:3001` for `FRONTEND_PUBLIC_URL`. Avoid mixing `localhost` and
`127.0.0.1` during login because the state and session cookies are host-bound.
Do not use the Docker service name `backend` in Steam OpenID `return_to`; Steam
and the browser cannot navigate to Docker-internal hostnames.

## Migration Note

The auth foundation was added during the local/dev migration squash into:

```txt
apps/backend/src/db/migrations/0001-initial-platform-schema.sql
```

The local PostgreSQL volume must be reset before applying this squashed
baseline. After this reset point, future schema changes should be new numbered
forward migrations.
