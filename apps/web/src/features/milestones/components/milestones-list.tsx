import type { ProfileMilestoneResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { getErrorMessage } from '@/lib/format';

import { MilestoneCard } from './milestone-card';

export function MilestonesList({
  error,
  isError,
  isLoading,
  milestones,
  title = 'Milestones',
}: Readonly<{
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
  milestones?: ProfileMilestoneResponseDto[];
  title?: string;
}>): ReactNode {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {isLoading ? <LoadingState message="Loading milestones..." /> : null}
      {isError ? (
        <ErrorState
          message={getErrorMessage(error)}
          title="Milestones unavailable"
        />
      ) : null}
      {!isLoading && !isError && (milestones?.length ?? 0) === 0 ? (
        <EmptyState message="No milestones have been recorded yet." />
      ) : null}
      {(milestones?.length ?? 0) > 0 ? (
        <div className="mt-4 grid gap-3">
          {milestones?.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
