# Media Assets

## Current Strategy

Steam-provided images are stored and rendered as external URLs only.

This includes:
- Steam profile avatars;
- Steam game icons/logos;
- Steam achievement icons and gray icons.

PostgreSQL URL fields populated from Steam sync remain the source of truth for
these assets. The app does not download, mirror, transform, or upload
Steam-provided images to Cloudinary.

## Why Steam Images Are Not Mirrored

Steam image URLs are third-party metadata supplied by Steam. Mirroring them into
Cloudinary would add storage cost, sync complexity, cache invalidation work, and
ownership ambiguity without solving a current product problem.

For now, keeping Steam URLs as URLs gives us:
- simpler sync writes;
- no asset ingestion pipeline for third-party media;
- no duplicate storage of Steam-owned images;
- no Cloudinary secret or upload surface in the current app.

## Frontend Rendering

The current frontend uses normal `<img>` elements for Steam image URLs. This is
acceptable for the MVP because the image dimensions are small, the URLs come
from persisted Steam metadata, and the app has not yet standardized on Next.js
image optimization.

If the frontend migrates Steam image rendering to `next/image`, configure
`images.remotePatterns` in `apps/web/next.config.ts` for only trusted Steam image
hosts used by synced data. Do not enable broad wildcard image hosts.

## Future Cloudinary Uses

Cloudinary is deferred until the app supports user-owned or generated media.
Expected future use cases:
- profile banners;
- guide images;
- share cards;
- generated gamercards.

Cloudinary should not be used for Steam-provided avatars, game icons, logos, or
achievement icons.

## Future `media_assets` Table

When user-generated or generated media is added, introduce a reviewed SQL
migration for a `media_assets` table instead of bolting upload metadata onto
Steam sync tables.

Likely fields:
- `id`;
- `owner_user_id`;
- `asset_type`;
- `provider`;
- `provider_public_id`;
- `secure_url`;
- `width`;
- `height`;
- `mime_type`;
- `byte_size`;
- `created_at`;
- `updated_at`.

Steam sync tables should continue storing Steam URL metadata separately.

## Signed Upload Strategy

Uploads should be backend-owned:
- authenticated user requests an upload signature from the backend;
- backend validates intent, ownership, type, and size limits;
- frontend uploads directly to Cloudinary with the short-lived signature;
- backend stores the resulting asset metadata after verifying ownership.

Do not expose Cloudinary API secrets to the frontend.

## Security Rules

- Never expose `CLOUDINARY_API_SECRET` or equivalent provider secrets.
- Validate file size before accepting upload metadata.
- Validate MIME type and file extension.
- Accept user-owned uploads only.
- Do not support arbitrary remote URL ingestion.
- Do not let users attach uploaded media to resources they do not own.
- Keep generated share cards/gamercards separate from Steam-provided image URLs.
