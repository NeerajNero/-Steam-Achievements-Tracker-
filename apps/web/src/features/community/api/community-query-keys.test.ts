import { describe, expect, it } from 'vitest';

import { communityQueryKeys } from './community-query-keys';

describe('communityQueryKeys', () => {
  it('creates stable guide and session community keys', () => {
    expect(communityQueryKeys.guideVoteSummary('guide-id')).toEqual([
      'community',
      'guide-vote-summary',
      'guide-id',
    ]);
    expect(communityQueryKeys.guideComments('guide-id')).toEqual([
      'community',
      'guide-comments',
      'guide-id',
    ]);
    expect(communityQueryKeys.sessionComments('session-id')).toEqual([
      'community',
      'session-comments',
      'session-id',
    ]);
  });
});
