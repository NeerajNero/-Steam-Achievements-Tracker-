import { describe, expect, it } from 'vitest';

import {
  normalizeSessionListFilters,
  parseSessionListFilters,
  toSessionListSearchParams,
} from './session-filters';

describe('session filters', () => {
  it('normalizes invalid URL params to safe defaults', () => {
    expect(
      normalizeSessionListFilters({
        status: 'unknown',
        limit: 999,
        offset: -10,
      }),
    ).toEqual({ status: 'open', limit: 20, offset: 0 });
  });

  it('parses and serializes list filters', () => {
    const filters = parseSessionListFilters(
      new URLSearchParams('status=completed&limit=50&offset=10'),
    );

    expect(filters).toEqual({ status: 'completed', limit: 50, offset: 10 });
    expect(toSessionListSearchParams(filters)).toBe(
      'status=completed&limit=50&offset=10',
    );
  });
});
