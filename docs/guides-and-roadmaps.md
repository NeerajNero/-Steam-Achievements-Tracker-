# Guides And Roadmaps

Guides v1 is Steam-only and game-scoped. It lets authenticated users create
plain-text achievement roadmaps for tracked Steam games and attach those guides
to canonical achievement metadata.

## Data Model

The foundation lives in migration:

```txt
0003-add-guides-foundation.sql
```

Tables:

- `guides`: one guide/roadmap for a Steam app, authored by an `app_users` row.
- `guide_sections`: ordered plain-text sections for a guide.
- `guide_achievements`: mappings from a guide to canonical `achievements`.

Guides use status and visibility instead of destructive deletes:

- status: `draft`, `published`, `archived`
- visibility: `public`, `unlisted`, `private`

Public list/detail endpoints return only `published` + `public` guides.

## Permissions

Creating and editing guides requires Sign in with Steam.

- Authors can edit their own guides.
- `admin` and `moderator` users can edit any guide.
- Public users can read only published public guides.
- Draft, archived, private, and unlisted guides are visible to the author through
  account guide management endpoints.

No session tokens, token hashes, cookies, or private account fields are exposed
by guide responses.

## Current UI

Frontend routes:

- `/games/:steamAppId/guides`
- `/games/:steamAppId/guides/:slug`
- `/games/:steamAppId/guides/new`
- `/account/guides`
- `/guides/:guideId/edit`

The editor is intentionally plain:

- textarea content only;
- no rich text editor;
- no image uploads;
- achievement attachment by UUID for now.

## Manual Smoke

Use a real signed-in browser session:

1. Open `/games/910001/guides/new`.
2. Create `Demo Completion Roadmap` with summary `Local smoke guide`.
3. Add one guide section.
4. Attach one achievement UUID from Steam App `910001`.
5. Publish the guide.
6. Verify `/games/910001/guides` lists it.
7. Verify `/games/910001/guides/:slug` shows the section and achievement.
8. Verify `/account/guides` lists it for the author.
9. Keep a draft/private guide unpublished and verify it is hidden publicly.

Do not print cookies, session tokens, token hashes, Steam API keys, or OpenID
payloads while testing.

## Deterministic Auth Smoke

For Docker/local verification without relying on a browser cookie, run:

```sh
docker-compose exec -T backend pnpm guide:auth-smoke
```

The script uses demo Steam ID `76561198000000000` and demo app ID `910001`.
It creates or reuses the local smoke auth link, creates a raw session token only
in process memory, stores only the hash in `auth_sessions`, and calls the real
HTTP guide endpoints with an internal `Cookie` header. It never prints the
cookie, raw token, token hash, Steam API key, or OpenID payloads.

The smoke creates a published guide titled `Demo Completion Roadmap`, adds one
section, attaches one achievement from app `910001`, verifies public list/detail
plus `/account/guides`, then verifies one guide vote and one visible guide
comment. It also verifies public `guide_published` and `guide_commented`
activity events. Before creating the guide, it removes only prior smoke guides for the
same smoke author, app, title, and summary so repeated runs are deterministic
and do not delete user-created guides.

To include the created guide in frontend route smoke, pass the reported slug:

```sh
docker-compose exec -T -e WEB_URL=http://localhost:3000 \
  -e WEB_GUIDE_SLUG=<slug> web node scripts/web-smoke.js
```

## Deferred Work

Future reviewed migrations/features can add:

- rich text or markdown rendering;
- guide images through the future media upload flow;
- richer comment editing UX, nested threads, and voting analytics;
- moderation/review queues for `content_reports`;
- guide version history;
- session-planning integration.

Cloudinary is not used for this foundation. Steam-provided images remain URL-only
Steam metadata, and future guide images should use a signed user-upload flow.
