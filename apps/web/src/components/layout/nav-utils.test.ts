import { describe, expect, it } from 'vitest';

import { isNavLinkActive } from './nav-utils';

describe('isNavLinkActive', () => {
  it('matches only the home route for /', () => {
    expect(isNavLinkActive('/', '/')).toBe(true);
    expect(isNavLinkActive('/games', '/')).toBe(false);
  });

  it('matches nested sections', () => {
    expect(isNavLinkActive('/games/910001', '/games')).toBe(true);
    expect(isNavLinkActive('/leaderboards/completion_percentage', '/leaderboards')).toBe(
      true,
    );
    expect(isNavLinkActive('/sessions', '/games')).toBe(false);
  });
});

