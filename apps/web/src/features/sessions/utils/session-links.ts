export interface SessionProfileLinkUser {
  steamId?: string | null;
  publicSlug?: string | null;
}

export function getSessionProfileHref(user: SessionProfileLinkUser): string | null {
  if (user.publicSlug && user.publicSlug.length > 0) {
    return `/u/${user.publicSlug}`;
  }

  if (user.steamId && user.steamId.length > 0) {
    return `/profiles/${user.steamId}`;
  }

  return null;
}
