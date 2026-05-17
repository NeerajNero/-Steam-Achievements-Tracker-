import { describe, expect, it } from 'vitest';

import { normalizeSlug, validatePublicSlug } from './settings';

describe('public profile settings helpers', () => {
  it('normalizes public slugs', () => {
    expect(normalizeSlug('  My-Steam-Profile  ')).toBe('my-steam-profile');
  });

  it('validates reserved and invalid slugs', () => {
    expect(validatePublicSlug('admin')).toBe('This slug is reserved.');
    expect(validatePublicSlug('bad_slug')).toBe(
      'Use 3 to 64 lowercase letters, numbers, or hyphens.',
    );
    expect(validatePublicSlug('steam-user')).toBeNull();
  });
});
