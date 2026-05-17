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
3. Backend creates or updates an `app_users` row.
4. Backend ensures the Steam profile exists in `steam_profiles`.
5. Backend links the user and profile through `user_steam_accounts`.
6. Backend creates `user_preferences` and `public_profiles` rows if missing.
7. Backend creates a server-managed session in `auth_sessions`.
8. Backend sets an httpOnly session cookie and redirects to the frontend.

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
- authenticated users see display name, linked Steam ID, and a sign-out button.

No protected settings pages or role-specific UI exist yet.

## Migration Note

The auth foundation was added during the local/dev migration squash into:

```txt
apps/backend/src/db/migrations/0001-initial-platform-schema.sql
```

The local PostgreSQL volume must be reset before applying this squashed
baseline. After this reset point, future schema changes should be new numbered
forward migrations.
