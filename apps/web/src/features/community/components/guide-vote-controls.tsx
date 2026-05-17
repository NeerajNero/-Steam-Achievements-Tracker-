'use client';

import { UpsertGuideVoteDtoValueEnum } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { getErrorMessage } from '@/lib/format';

import { useGuideVoteSummary } from '../api/use-guide-vote-summary';
import { useRemoveGuideVote } from '../api/use-remove-guide-vote';
import { useUpsertGuideVote } from '../api/use-upsert-guide-vote';

export function GuideVoteControls({
  guideId,
}: Readonly<{
  guideId: string;
}>): ReactNode {
  const currentUser = useCurrentUser();
  const summary = useGuideVoteSummary(guideId);
  const upsertVote = useUpsertGuideVote(guideId);
  const removeVote = useRemoveGuideVote(guideId);
  const isAuthenticated = Boolean(currentUser.data);

  if (summary.isLoading) {
    return <LoadingState message="Loading vote summary..." />;
  }

  if (summary.isError) {
    return (
      <ErrorState
        message={getErrorMessage(summary.error)}
        title="Vote summary unavailable"
      />
    );
  }

  const data = summary.data;

  if (!data) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">Guide votes</h2>
          <p className="mt-1 text-sm text-slate-600">
            Score {data.score} · {data.upvotes} up · {data.downvotes} down
          </p>
        </div>
        {isAuthenticated ? (
          <div className="flex flex-wrap gap-2">
            <button
              className={voteButtonClass(data.currentUserVote === 1)}
              disabled={upsertVote.isPending}
              onClick={() =>
                void upsertVote.mutateAsync(UpsertGuideVoteDtoValueEnum.NUMBER_1)
              }
              type="button"
            >
              Upvote
            </button>
            <button
              className={voteButtonClass(data.currentUserVote === -1)}
              disabled={upsertVote.isPending}
              onClick={() =>
                void upsertVote.mutateAsync(
                  UpsertGuideVoteDtoValueEnum.NUMBER_MINUS_1,
                )
              }
              type="button"
            >
              Downvote
            </button>
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              disabled={removeVote.isPending || data.currentUserVote === null}
              onClick={() => void removeVote.mutateAsync()}
              type="button"
            >
              Remove vote
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Sign in with Steam to vote.</p>
        )}
      </div>
    </section>
  );
}

function voteButtonClass(active: boolean): string {
  return active
    ? 'rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60'
    : 'rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60';
}
