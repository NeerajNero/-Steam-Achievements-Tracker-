'use client';

import Link from 'next/link';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useBadgeDefinitions } from '@/features/badges/api/use-badge-definitions';
import { BadgeCard } from '@/features/badges/components/badge-card';
import { getErrorMessage } from '@/lib/format';

export default function BadgesPage() {
  const badges = useBadgeDefinitions();

  return (
    <PageShell maxWidth="max-w-6xl">
      <div className="mb-4">
        <Link className="text-sm font-medium text-lime-200 hover:text-lime-100" href="/">
          Back to home
        </Link>
      </div>
      <div className="mb-6">
        <PageHero eyebrow="Milestone rewards" title="Steam Badges">
          <p>
          Badges are earned from Steam profile milestones.
          </p>
        </PageHero>
      </div>
      {badges.isLoading ? <LoadingState message="Loading badges..." /> : null}
      {badges.isError ? (
        <ErrorState
          message={getErrorMessage(badges.error)}
          title="Badges unavailable"
        />
      ) : null}
      {!badges.isLoading && !badges.isError && (badges.data?.items.length ?? 0) === 0 ? (
        <EmptyState message="No badge definitions are active yet." />
      ) : null}
      {(badges.data?.items.length ?? 0) > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.data?.items.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </section>
      ) : null}
    </PageShell>
  );
}
