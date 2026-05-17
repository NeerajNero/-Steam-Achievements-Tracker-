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

## Deferred Work

Future reviewed migrations/features can add:

- rich text or markdown rendering;
- guide images through the future media upload flow;
- comments and voting;
- moderation/review queues;
- guide version history;
- session-planning integration.

Cloudinary is not used for this foundation. Steam-provided images remain URL-only
Steam metadata, and future guide images should use a signed user-upload flow.
