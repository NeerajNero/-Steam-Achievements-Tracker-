import type { AccountTargetResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { getErrorMessage } from '@/lib/format';

import { TargetCard } from './target-card';

export function TargetList({
  actionHref,
  actionLabel,
  compact = false,
  emptyTitle = 'No active targets',
  emptyMessage = 'No targets yet. Add games or achievements to build a completion to-do list.',
  error,
  isError = false,
  isLoading = false,
  targets,
  title = 'Targets',
}: Readonly<{
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
  targets: readonly AccountTargetResponseDto[] | undefined;
  title?: string;
}>): ReactNode {
  return (
    <SectionCard
      actions={
        actionHref && actionLabel ? (
          <Link
            className="rounded-full border border-lime-300/30 px-3 py-2 text-sm font-semibold text-lime-100 hover:bg-lime-300/10"
            href={actionHref}
          >
            {actionLabel}
          </Link>
        ) : null
      }
      description="Saved completion targets for games and achievements. Active targets drop out of the dashboard after sync confirms completion."
      title={title}
    >
      {isLoading ? <LoadingState message="Loading targets..." /> : null}
      {isError ? <ErrorState message={getErrorMessage(error)} /> : null}
      {targets !== undefined && targets.length === 0 ? (
        <EmptyState message={emptyMessage} title={emptyTitle} />
      ) : null}
      {targets !== undefined && targets.length > 0 ? (
        <div className={compact ? 'grid gap-3' : 'grid gap-3'}>
          {targets.map((target) => (
            <TargetCard compact={compact} key={target.id} target={target} />
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
