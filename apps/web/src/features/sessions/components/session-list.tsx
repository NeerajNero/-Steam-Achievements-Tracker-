import type { GamingSessionSummaryResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { getErrorMessage } from '@/lib/format';

import { SessionCard } from './session-card';

export function SessionList({
  emptyMessage = 'No public sessions are scheduled yet.',
  error,
  isError,
  isLoading,
  items,
}: Readonly<{
  emptyMessage?: string;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  items: GamingSessionSummaryResponseDto[] | undefined;
}>): ReactNode {
  if (isLoading) {
    return <LoadingState message="Loading sessions..." />;
  }

  if (isError) {
    return (
      <ErrorState message={getErrorMessage(error)} title="Sessions unavailable" />
    );
  }

  if (!items || items.length === 0) {
    return <EmptyState message={emptyMessage} title="No sessions" />;
  }

  return (
    <div className="grid gap-3">
      {items.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}
