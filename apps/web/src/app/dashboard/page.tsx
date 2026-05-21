'use client';

import {
  type QueuedSyncResponseDto,
  SyncRequestDtoScopeEnum,
  type MyDashboardResponseDto,
} from '@steam-achievement/client-sdk';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { ResponsiveTwoColumn } from '@/components/ui/responsive-two-column';
import { buildSignInUrl } from '@/features/auth/components/auth-status';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys';
import { useMyDashboard } from '@/features/dashboard/api/use-my-dashboard';
import { DashboardGuides } from '@/features/dashboard/components/dashboard-guides';
import { DashboardHero } from '@/features/dashboard/components/dashboard-hero';
import { DashboardSessions } from '@/features/dashboard/components/dashboard-sessions';
import { DashboardSignInPrompt } from '@/features/dashboard/components/dashboard-sign-in-prompt';
import { NextTargets } from '@/features/dashboard/components/next-targets';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { RecentProgress } from '@/features/dashboard/components/recent-progress';
import { SyncAttention } from '@/features/dashboard/components/sync-attention';
import { useEnqueueSync } from '@/features/profile/api/use-enqueue-sync';
import { TargetList } from '@/features/targets/components/target-list';
import { getErrorMessage } from '@/lib/format';

const DASHBOARD_SYNC_POLL_INTERVAL_MS = 3_000;

export default function DashboardPage(): ReactNode {
  const currentUser = useCurrentUser();
  const dashboard = useMyDashboard(currentUser.data !== undefined && currentUser.data !== null);

  if (currentUser.isLoading) {
    return (
      <PageShell>
        <div className="mb-6">
          <PageHero eyebrow="Hunter command center" title="Hunter Command Center">
            <p>Loading your signed-in Steam dashboard.</p>
          </PageHero>
        </div>
        <LoadingState message="Checking sign-in status..." />
      </PageShell>
    );
  }

  if (currentUser.isError) {
    return (
      <PageShell>
        <ErrorState
          message={getErrorMessage(currentUser.error)}
          title="Unable to check sign-in status"
        />
      </PageShell>
    );
  }

  if (!currentUser.data) {
    return (
      <PageShell maxWidth="max-w-4xl">
        <div className="mb-6">
          <PageHero eyebrow="Hunter command center" title="Hunter Command Center">
            <p>Personalized Steam targets, progress, sessions, guides, and sync attention.</p>
          </PageHero>
        </div>
        <DashboardSignInPrompt signInUrl={buildSignInUrl('/dashboard')} />
      </PageShell>
    );
  }

  if (dashboard.isLoading) {
    return (
      <PageShell>
        <div className="mb-6">
          <PageHero eyebrow="Hunter command center" title="Hunter Command Center">
            <p>Building your command center from synced Steam data.</p>
          </PageHero>
        </div>
        <LoadingState message="Loading dashboard..." />
      </PageShell>
    );
  }

  if (dashboard.isError) {
    return (
      <PageShell>
        <ErrorState
          message={getErrorMessage(dashboard.error)}
          title="Dashboard is unavailable"
        />
      </PageShell>
    );
  }

  if (!dashboard.data) {
    return (
      <PageShell maxWidth="max-w-4xl">
        <div className="mb-6">
          <PageHero eyebrow="Hunter command center" title="Hunter Command Center">
            <p>Personalized Steam targets, progress, sessions, guides, and sync attention.</p>
          </PageHero>
        </div>
        <DashboardSignInPrompt signInUrl={buildSignInUrl('/dashboard')} />
      </PageShell>
    );
  }

  if (dashboard.data.status === 'link_required' || !dashboard.data.profile) {
    return (
      <PageShell maxWidth="max-w-4xl">
        <div className="mb-6">
          <PageHero eyebrow="Hunter command center" title="Hunter Command Center">
            <p>Personalized Steam targets, progress, sessions, guides, and sync attention.</p>
          </PageHero>
        </div>
        <EmptyState
          action={
            <Link
              className="inline-flex rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
              href="/settings"
            >
              Link Steam profile
            </Link>
          }
          message="Your account is signed in, but no primary Steam profile is linked yet."
          title="Link a Steam profile"
        />
      </PageShell>
    );
  }

  return <DashboardReadyView dashboard={dashboard.data} />;
}

function DashboardReadyView({
  dashboard,
}: Readonly<{
  dashboard: MyDashboardResponseDto;
}>): ReactNode {
  const queryClient = useQueryClient();
  const profile = dashboard.profile;
  const [queuedSync, setQueuedSync] = useState<QueuedSyncResponseDto | null>(null);
  const [pendingScope, setPendingScope] = useState<SyncRequestDtoScopeEnum | null>(
    null,
  );
  const enqueueSync = useEnqueueSync(profile?.steamId ?? '');

  useEffect(() => {
    if (!queuedSync) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.me() });
    }, DASHBOARD_SYNC_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [queryClient, queuedSync]);

  async function enqueue(scope: SyncRequestDtoScopeEnum): Promise<void> {
    if (!profile) {
      return;
    }

    setPendingScope(scope);

    try {
      const response = await enqueueSync.mutateAsync({ scope });
      setQueuedSync(response);
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.me() });
    } finally {
      setPendingScope(null);
    }
  }

  if (!profile) {
    return null;
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <DashboardHero dashboard={dashboard} />
        <ResponsiveTwoColumn
          aside={
            <>
              <QuickActions
                latestSync={dashboard.latestSyncRuns[0] ?? null}
                onSync={(scope) => void enqueue(scope)}
                pendingScope={pendingScope}
                publicSlug={
                  profile.publicProfileIsPublished ? profile.publicSlug : undefined
                }
                queuedSync={queuedSync}
                steamId={profile.steamId}
              />
              <SyncAttention
                dataQuality={dashboard.dataQuality}
                steamId={profile.steamId}
              />
              <DashboardSessions
                hosted={dashboard.sessions.hosted}
                joined={dashboard.sessions.joined}
                upcomingForOwnedGames={dashboard.sessions.upcomingForOwnedGames}
              />
              <DashboardGuides
                authored={dashboard.guides.authored}
                suggested={dashboard.guides.suggested}
              />
            </>
          }
          layout="content-heavy"
        >
          <TargetList
            actionHref="/account/targets"
            actionLabel="Manage Targets"
            compact
            emptyMessage="No active targets yet. Add games or achievements to build the list you want sync to manage for you."
            targets={[
              ...dashboard.activeTargets.games,
              ...dashboard.activeTargets.achievements,
            ]}
            title="Active Targets"
          />
          <div className="space-y-6">
            <NextTargets targets={dashboard.nextTargets} />
            <RecentProgress
              activity={dashboard.recentActivity}
              badges={dashboard.badges}
              milestones={dashboard.milestones}
              syncRuns={dashboard.latestSyncRuns}
            />
          </div>
        </ResponsiveTwoColumn>
      </div>
    </PageShell>
  );
}
