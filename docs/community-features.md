# Community Features

Community interactions are Steam-only and currently cover guide votes, guide
comments, gaming-session comments, and private report intake.

## Data Model

Migration `0005-add-community-interactions.sql` adds:

- `guide_votes`: one authenticated upvote or downvote per user per guide.
- `guide_comments`: flat comments on guides.
- `session_comments`: flat comments on gaming sessions.
- `content_reports`: authenticated report intake for future moderation.

Comments and reports use status fields instead of destructive deletes. Guide and
session comments are soft-deleted by setting status to `deleted`; report review
states are `open`, `reviewed`, `dismissed`, and `actioned`.

Foreign keys use `ON DELETE RESTRICT` where a direct foreign key exists. Reports
store `target_type` and `target_id` so future moderation can accept multiple
content types without exposing moderation internals publicly.

## Current Behavior

Public users can:

- read guide vote summaries;
- read visible guide comments;
- read visible comments on public gaming sessions.

Authenticated users can:

- upvote, downvote, or remove their guide vote;
- create guide comments;
- create comments on public sessions;
- create comments on private or unlisted sessions only when they can view the
  session as host, participant, admin, or moderator;
- create content reports.

Comment authors, admins, and moderators can edit or soft-delete comments.

## API

Guide votes:

- `GET /guides/:guideId/votes/summary`
- `PUT /guides/:guideId/vote`
- `DELETE /guides/:guideId/vote`

Guide comments:

- `GET /guides/:guideId/comments`
- `POST /guides/:guideId/comments`
- `PATCH /guides/:guideId/comments/:commentId`
- `DELETE /guides/:guideId/comments/:commentId`

Session comments:

- `GET /sessions/:sessionId/comments`
- `POST /sessions/:sessionId/comments`
- `PATCH /sessions/:sessionId/comments/:commentId`
- `DELETE /sessions/:sessionId/comments/:commentId`

Reports:

- `POST /reports`

Responses expose public author display data only: display name, Steam ID,
avatar URL, and public profile slug. They do not expose cookies, session rows,
token hashes, account roles, or private account settings.

## Frontend

The frontend uses generated `CommunityApi` and `ReportsApi` SDK clients.

Guide detail pages show:

- vote controls;
- visible comments;
- a comment form for signed-in users;
- a report form for signed-in users.

Session detail pages show:

- visible comments;
- a comment form for signed-in users;
- a report form for signed-in users.

There is no real-time chat, nested threading, notification system, upload flow,
or moderation dashboard yet.

Community sections should use the shared dashboard card, state, and auth prompt
patterns. Signed-out users can read public content but should see a clear Steam
sign-in prompt before commenting, voting, or reporting.

## Smoke Coverage

`guide:auth-smoke` verifies guide creation/publishing and now also verifies a
guide vote plus guide comment through real authenticated HTTP endpoints. It also
checks the guide publish/comment activity events.

`session:auth-smoke` verifies session creation/join/leave and now also verifies
a session comment through real authenticated HTTP endpoints. It also checks the
session create/join/comment activity events.

`community:auth-smoke` verifies deterministic report intake through the real
authenticated HTTP endpoint. It creates a smoke guide and guide comment when
needed, reports that guide comment, then verifies the `content_reports` row with
safe identifiers only. Repeated runs clean only smoke-owned guide/comment/report
rows and do not delete non-smoke community data.

All auth smoke scripts create raw session tokens only in process memory, store
only token hashes in `auth_sessions`, pass an internal cookie header to the
backend, and do not print cookies, raw tokens, token hashes, OpenID payloads, or
Steam API keys.

Run the full community smoke set locally with:

```sh
docker-compose exec -T backend pnpm guide:auth-smoke
docker-compose exec -T backend pnpm session:auth-smoke
docker-compose exec -T backend pnpm community:auth-smoke
```

Safe report inspection should use counts and public moderation fields only. Do
not select session token hashes or auth cookies:

```sql
select target_type, reason, status, count(*) as reports
from content_reports
group by target_type, reason, status
order by target_type, reason, status;
```

## Deferred Work

- real-time chat;
- nested comment threads;
- moderation dashboard and reviewer actions;
- notifications and reminders;
- file/image uploads;
- anti-abuse scoring or rate limits beyond normal auth requirements.
