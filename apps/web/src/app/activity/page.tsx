'use client';

import type { ReactNode } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { useGlobalActivity } from '@/features/activity/api/use-global-activity';
import { ActivityFeed } from '@/features/activity/components/activity-feed';

export default function ActivityPage(): ReactNode {
  const activity = useGlobalActivity({ limit: 30, offset: 0 });

  return (
    <PageShell maxWidth="max-w-5xl">
      <div className="mb-6">
        <PageHero eyebrow="Public platform feed" title="Steam Activity">
          <p>
          Public platform events from synced Steam profiles, guides, sessions, and
          milestones.
          </p>
        </PageHero>
      </div>

      <ActivityFeed
        error={activity.error}
        isError={activity.isError}
        isLoading={activity.isLoading}
        items={activity.data?.items}
        title="Latest activity"
      />
    </PageShell>
  );
}
