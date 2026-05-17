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
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Guide votes</h2>
          <p className="mt-1 text-sm text-slate-400">
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
              className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
              disabled={removeVote.isPending || data.currentUserVote === null}
              onClick={() => void removeVote.mutateAsync()}
              type="button"
            >
              Remove vote
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Sign in with Steam to vote.</p>
        )}
      </div>
    </section>
  );
}

function voteButtonClass(active: boolean): string {
  return active
    ? 'rounded-xl bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60'
    : 'rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60';
}
