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
      <PageHero eyebrow="Public platform feed" title="Steam Activity">
        <p>
          Public events from synced Steam profiles, guides, sessions, milestones,
          and badge unlock moments. Use this page to see what changed recently and
          jump back into the relevant profile, game, guide, or session.
        </p>
      </PageHero>
      <ActivityFeed
        description="Recent public platform events with links back to their related profiles and games."
        error={activity.error}
        isError={activity.isError}
        isLoading={activity.isLoading}
        items={activity.data?.items}
        title="Latest activity"
      />
    </PageShell>
  );
}
