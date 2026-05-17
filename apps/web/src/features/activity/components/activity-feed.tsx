import type { ActivityEventResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { getErrorMessage } from '@/lib/format';

import { ActivityEventCard } from './activity-event-card';

export function ActivityFeed({
  error,
  isError,
  isLoading,
  items,
  title = 'Recent activity',
}: Readonly<{
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
  items?: ActivityEventResponseDto[];
  title?: string;
}>): ReactNode {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {isLoading ? <LoadingState message="Loading activity..." /> : null}
      {isError ? (
        <ErrorState message={getErrorMessage(error)} title="Activity unavailable" />
      ) : null}
      {!isLoading && !isError && (items?.length ?? 0) === 0 ? (
        <EmptyState message="No public activity has been recorded yet." />
      ) : null}
      {(items?.length ?? 0) > 0 ? (
        <div className="mt-4 grid gap-3">
          {items?.map((event) => <ActivityEventCard event={event} key={event.id} />)}
        </div>
      ) : null}
    </section>
  );
}
