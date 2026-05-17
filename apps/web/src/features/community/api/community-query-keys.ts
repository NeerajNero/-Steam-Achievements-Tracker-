export const communityQueryKeys = {
  all: ['community'] as const,
  guideVoteSummary: (guideId: string) =>
    [...communityQueryKeys.all, 'guide-vote-summary', guideId] as const,
  guideComments: (guideId: string) =>
    [...communityQueryKeys.all, 'guide-comments', guideId] as const,
  sessionComments: (sessionId: string) =>
    [...communityQueryKeys.all, 'session-comments', sessionId] as const,
};
