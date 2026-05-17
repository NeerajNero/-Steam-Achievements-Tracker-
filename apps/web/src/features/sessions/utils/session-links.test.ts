import { describe, expect, it } from 'vitest';

import { getSessionProfileHref } from './session-links';

describe('getSessionProfileHref', () => {
  it('prefers public profile slugs over raw Steam profile routes', () => {
    expect(
      getSessionProfileHref({
        publicSlug: 'nero',
        steamId: '76561198000000000',
      }),
    ).toBe('/u/nero');
  });

  it('falls back to Steam profile routes when no public slug exists', () => {
    expect(getSessionProfileHref({ steamId: '76561198000000000' })).toBe(
      '/profiles/76561198000000000',
    );
  });

  it('returns null when no public profile target is available', () => {
    expect(getSessionProfileHref({})).toBeNull();
  });
});
