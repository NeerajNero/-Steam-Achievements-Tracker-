'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { AuthStatus } from '@/features/auth/components/auth-status';
import { useGlobalActivity } from '@/features/activity/api/use-global-activity';
import { ActivityFeed } from '@/features/activity/components/activity-feed';

export default function ActivityPage(): ReactNode {
  const activity = useGlobalActivity({ limit: 30, offset: 0 });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-700" href="/">
          Back to home
        </Link>
        <AuthStatus />
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Steam Activity
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Public platform events from synced Steam profiles, guides, sessions, and
          milestones.
        </p>
      </header>

      <ActivityFeed
        error={activity.error}
        isError={activity.isError}
        isLoading={activity.isLoading}
        items={activity.data?.items}
        title="Latest activity"
      />
    </main>
  );
}
