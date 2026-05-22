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
          className="rounded-[22px] border border-white/10 bg-slate-950/75 p-5 shadow-xl shadow-black/20 transition hover:border-lime-300/30 hover:bg-slate-900"
          key={guide.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                className="text-lg font-semibold text-white hover:text-lime-200"
                href={`/games/${guide.steamAppId}/guides/${guide.slug}`}
              >
                {guide.title}
              </Link>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {guide.summary ?? 'No summary provided.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>By {guide.author.displayName ?? 'Steam user'}</span>
                <span>Published {formatDateTime(guide.publishedAt)}</span>
                <span>Steam App {guide.steamAppId}</span>
              </div>
            </div>
            <GuideStatusBadge status={guide.status} />
          </div>
          <div className="mt-4">
            <Link
              className="inline-flex text-sm font-semibold text-lime-200 hover:text-lime-100"
              href={`/games/${guide.steamAppId}/guides/${guide.slug}`}
            >
              Open guide
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
