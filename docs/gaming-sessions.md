# Gaming Sessions

Gaming sessions are the foundation for Steam-only co-op and achievement
boosting coordination.

## Current Scope

V1 supports:

- public upcoming session browsing;
- game-scoped session lists;
- authenticated session creation;
- host updates and cancellation;
- participant join/leave;
- achievement attachment for a session.

V1 does not include real-time chat, reminders, notifications, calendar
integration, uploads, payments, or moderation workflows. Flat session comments
exist as part of the community foundation, but they are not a chat system.

## Data Model

Migration `0004-add-gaming-sessions-foundation.sql` adds:

- `gaming_sessions`: scheduled Steam game sessions hosted by an app user.
- `gaming_session_participants`: host and participant membership rows.
- `gaming_session_achievements`: canonical Steam achievements targeted by a
  session.

Foreign keys use `ON DELETE RESTRICT`. Historical session records should be
cancelled or completed rather than hard-deleted.

## Lifecycle

Supported session statuses:

- `open`: users can join.
- `full`: max joined participants has been reached.
- `completed`: session has happened.
- `cancelled`: host or moderator cancelled the session.

Supported visibility values:

- `public`: appears in public list endpoints.
- `unlisted`: hidden from public lists, but visible by direct detail to joined
  participants or host.
- `private`: visible only to host, admins/moderators, and joined participants.

## Authorization

Public users can read public sessions.

Authenticated users can:

- create sessions for tracked Steam games;
- join open sessions;
- leave sessions they joined, unless they are the host.

Hosts, admins, and moderators can:

- update sessions;
- cancel sessions;
- attach and detach achievements.

Host ownership transfer is deferred. In v1, hosts cannot leave their own session;
they should cancel it instead.

## API

Public reads:

- `GET /sessions`
- `GET /games/:steamAppId/sessions`
- `GET /sessions/:sessionId`

Authenticated writes:

- `POST /games/:steamAppId/sessions`
- `PATCH /sessions/:sessionId`
- `POST /sessions/:sessionId/join`
- `POST /sessions/:sessionId/leave`
- `POST /sessions/:sessionId/cancel`
- `POST /sessions/:sessionId/achievements`
- `DELETE /sessions/:sessionId/achievements/:achievementId`

All endpoints are database-backed. The frontend never calls Steam directly.

## Frontend

Frontend routes:

- `/sessions`
- `/sessions/:sessionId`
- `/games/:steamAppId/sessions`
- `/games/:steamAppId/sessions/new`
- `/sessions/:sessionId/edit`

The UI uses the generated SDK `SessionsApi`, React Query hooks, and URL params
for basic public list filters.

## Deterministic Smoke

Run the local authenticated smoke after migrations and seed data:

```sh
docker-compose exec -T backend pnpm session:auth-smoke
```

The smoke:

- creates short-lived local smoke sessions in memory;
- creates/reuses deterministic local smoke users;
- stores only hashed session tokens in `auth_sessions`;
- uses real HTTP endpoints with a cookie header;
- creates a session for app `910001`;
- attaches one achievement;
- verifies public list/detail;
- verifies participant join/leave.
- verifies one visible session comment.
- verifies public `session_created`, `session_joined`, and `session_commented`
  activity events.

It does not print cookies, raw session tokens, session token hashes, OpenID
payloads, or Steam API keys.

## Future Work

Deferred additions:

- real-time session chat and nested comment threads;
- reminders and notifications;
- calendar export;
- host transfer;
- no-show tracking;
- moderation and reporting;
- richer private/unlisted sharing controls.
