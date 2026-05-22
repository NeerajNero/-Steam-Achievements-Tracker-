'use client';

import { CreateContentReportDtoTargetTypeEnum } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { getErrorMessage } from '@/lib/format';

import { useCreateGuideComment } from '../api/use-create-guide-comment';
import { useGuideComments } from '../api/use-guide-comments';
import { CommentForm } from './comment-form';
import { CommentsList } from './comments-list';
import { GuideVoteControls } from './guide-vote-controls';
import { ReportContentButton } from './report-content-button';

export function GuideCommunitySection({
  guideId,
}: Readonly<{
  guideId: string;
}>): ReactNode {
  const currentUser = useCurrentUser();
  const comments = useGuideComments(guideId);
  const createComment = useCreateGuideComment(guideId);

  return (
    <section className="grid gap-6">
      <SectionCard>
        <div className="border-b border-white/10 p-4">
          <h2 className="font-semibold text-white">Guide feedback</h2>
          <p className="mt-1 text-sm text-slate-400">
            Votes signal usefulness. Comments should stay focused on route clarity, missables, and achievement help.
          </p>
          <div className="mt-4">
            <GuideVoteControls guideId={guideId} />
          </div>
        </div>
        <div className="border-b border-white/10 p-4">
          {currentUser.data ? (
            <CommentForm onSubmit={(body) => createComment.mutateAsync(body)} />
          ) : (
            <p className="text-sm text-slate-400">
              Sign in with Steam to comment.
            </p>
          )}
        </div>
        {comments.isLoading ? <LoadingState message="Loading comments..." /> : null}
        {comments.isError ? (
          <ErrorState
            message={getErrorMessage(comments.error)}
            title="Comments unavailable"
          />
        ) : null}
        {comments.data ? <CommentsList comments={comments.data.items} /> : null}
      </SectionCard>

      <ReportContentButton
        targetId={guideId}
        targetType={CreateContentReportDtoTargetTypeEnum.Guide}
      />
    </section>
  );
}
