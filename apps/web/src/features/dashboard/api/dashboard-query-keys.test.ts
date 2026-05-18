import { describe, expect, it } from 'vitest';

import { dashboardQueryKeys } from './dashboard-query-keys';

describe('dashboardQueryKeys', () => {
  it('keeps the signed-in dashboard key stable', () => {
    expect(dashboardQueryKeys.me()).toEqual(['dashboard', 'me']);
  });
});
