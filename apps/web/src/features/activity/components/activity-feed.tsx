import type { ActivityEventResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { getErrorMessage } from '@/lib/format';

import { ActivityEventCard } from './activity-event-card';

export function ActivityFeed({
  description,
  error,
  isError,
  isLoading,
  items,
  title = 'Recent activity',
}: Readonly<{
  description?: string;
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
  items?: ActivityEventResponseDto[];
  title?: string;
}>): ReactNode {
  return (
    <SectionCard description={description} title={title}>
      {isLoading ? <LoadingState message="Loading activity..." /> : null}
      {isError ? (
        <ErrorState message={getErrorMessage(error)} title="Activity unavailable" />
      ) : null}
      {!isLoading && !isError && (items?.length ?? 0) === 0 ? (
        <EmptyState message="No public activity has been recorded yet." />
      ) : null}
      {(items?.length ?? 0) > 0 ? (
        <div className="grid gap-3">
          {items?.map((event) => <ActivityEventCard event={event} key={event.id} />)}
        </div>
      ) : null}
    </SectionCard>
  );
}
