import Link from 'next/link';
import type { ReactNode } from 'react';
import type { GuideSummaryResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { getErrorMessage, formatDateTime } from '@/lib/format';

import { GuideStatusBadge } from './guide-status-badge';

export function GuideList({
  error,
  isError,
  isLoading,
  items,
}: Readonly<{
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  items: GuideSummaryResponseDto[] | undefined;
}>): ReactNode {
  if (isLoading) {
    return <LoadingState message="Loading guides..." />;
  }

  if (isError) {
    return <ErrorState message={getErrorMessage(error)} title="Guides unavailable" />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        message="No published guides are available for this Steam game yet."
        title="No guides yet"
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((guide) => (
        <article
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          key={guide.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                className="text-lg font-semibold text-slate-950 hover:text-blue-700"
                href={`/games/${guide.steamAppId}/guides/${guide.slug}`}
              >
                {guide.title}
              </Link>
              <p className="mt-1 text-sm text-slate-600">
                {guide.summary ?? 'No summary provided.'}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                By {guide.author.displayName ?? 'Steam user'} · Published{' '}
                {formatDateTime(guide.publishedAt)}
              </p>
            </div>
            <GuideStatusBadge status={guide.status} />
          </div>
        </article>
      ))}
    </div>
  );
}
