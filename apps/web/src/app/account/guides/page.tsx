'use client';

import Link from 'next/link';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useAccountGuides } from '@/features/guides/api/use-account-guides';
import { GuideStatusBadge } from '@/features/guides/components/guide-status-badge';
import { getErrorMessage, formatDateTime } from '@/lib/format';

export default function AccountGuidesPage() {
  const guides = useAccountGuides();

  return (
    <PageShell maxWidth="max-w-5xl">
      <div className="mb-4">
        <Link className="text-sm font-medium text-lime-200 hover:text-lime-100" href="/settings">
          Back to settings
        </Link>
      </div>

      <div className="mb-6">
        <PageHero eyebrow="Author dashboard" title="Your guides" />
      </div>

      {guides.isLoading ? <LoadingState message="Loading your guides..." /> : null}
      {guides.isError ? (
        <ErrorState message={getErrorMessage(guides.error)} title="Guides unavailable" />
      ) : null}
      {guides.data === null ? (
        <ErrorState message="Sign in with Steam to manage guides." title="Sign in required" />
      ) : null}
      {guides.data && guides.data.items.length === 0 ? (
        <EmptyState
          message="Create a guide from a global Steam game page."
          title="No guides yet"
        />
      ) : null}
      {guides.data && guides.data.items.length > 0 ? (
        <div className="grid gap-3">
          {guides.data.items.map((guide) => (
            <article
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20"
              key={guide.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    className="text-lg font-semibold text-white hover:text-lime-200"
                    href={`/guides/${guide.id}/edit`}
                  >
                    {guide.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-400">
                    {guide.game.name} · Updated {formatDateTime(guide.updatedAt)}
                  </p>
                </div>
                <GuideStatusBadge status={guide.status} />
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}
