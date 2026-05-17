'use client';

import Link from 'next/link';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { useAccountGuides } from '@/features/guides/api/use-account-guides';
import { GuideStatusBadge } from '@/features/guides/components/guide-status-badge';
import { getErrorMessage, formatDateTime } from '@/lib/format';

export default function AccountGuidesPage() {
  const guides = useAccountGuides();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-700" href="/settings">
          Back to settings
        </Link>
        <AuthStatus />
      </div>

      <h1 className="mb-6 text-3xl font-semibold tracking-normal text-slate-950">
        Your guides
      </h1>

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
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              key={guide.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    className="text-lg font-semibold text-slate-950 hover:text-blue-700"
                    href={`/guides/${guide.id}/edit`}
                  >
                    {guide.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">
                    {guide.game.name} · Updated {formatDateTime(guide.updatedAt)}
                  </p>
                </div>
                <GuideStatusBadge status={guide.status} />
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </main>
  );
}
