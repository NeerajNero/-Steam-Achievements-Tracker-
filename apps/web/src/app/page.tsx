'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { ActionPanel } from '@/components/ui/action-panel';
import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { EntityLinkCard } from '@/components/ui/entity-link-card';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { SummaryCard } from '@/components/ui/summary-card';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { buildSignInUrl } from '@/features/auth/components/auth-status';

const DEMO_STEAM_ID = '76561198000000000';

export default function HomePage() {
  const router = useRouter();
  const [steamId, setSteamId] = useState(DEMO_STEAM_ID);
  const currentUser = useCurrentUser();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const normalizedSteamId = steamId.trim();

    if (normalizedSteamId.length > 0) {
      router.push(`/profiles/${encodeURIComponent(normalizedSteamId)}`);
    }
  }

  return (
    <PageShell>
      <PageHero
        actions={
          <>
            {currentUser.data ? (
              <Link
                className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
                href="/dashboard"
              >
                Open dashboard
              </Link>
            ) : (
              <a
                className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
                href={buildSignInUrl('/dashboard')}
              >
                Sign in with Steam
              </a>
            )}
            <Link
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              href={`/profiles/${DEMO_STEAM_ID}`}
            >
              Open demo profile
            </Link>
          </>
        }
        eyebrow="Steam-only achievement hunting"
        title="Track completions, plan targets, and decide the next 100% faster."
      >
        <p>
          Steam-only profile sync, game metadata, targets, leaderboards, guides,
          sessions, activity, badges, and showcase pages stay in one dark command
          center. Every route is meant to answer what this page is for, the most
          useful stat right now, the next action, and whether missing data is a Steam
          limitation or simply not synced yet.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="accent">Steam-only</StatusBadge>
          <StatusBadge tone="info">Queued sync runs</StatusBadge>
          <StatusBadge tone="warning">Unknown unlock state stays unknown</StatusBadge>
          <StatusBadge tone="success">Public showcase pages</StatusBadge>
        </div>
      </PageHero>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          hint="Paste a Steam ID or use the seeded demo profile."
          label="Public entry point"
          value="Profiles + game hubs"
        />
        <SummaryCard
          hint="Dashboard, targets, guide authoring, and session participation."
          label="Sign-in unlocks"
          value="Private hunter tools"
        />
        <SummaryCard
          hint="Metadata-only stays distinct from locked; unsynced stays distinct from no achievements."
          label="Data clarity"
          value="State explained"
        />
        <SummaryCard
          hint="Routes are tuned for Steam profile tracking only."
          label="Platform scope"
          value="Steam only"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <SectionCard
          description="Paste a stored Steam ID, open the seeded demo profile, or move straight into the signed-in dashboard."
          title="Find A Steam Profile"
        >
          <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Steam ID</span>
              <input
                className="h-12 rounded-xl border border-white/10 bg-slate-900 px-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/20"
                inputMode="numeric"
                name="steamId"
                onChange={(event) => setSteamId(event.target.value)}
                placeholder="76561198000000000"
                value={steamId}
              />
            </label>
            <div className="flex items-end">
              <button
                aria-label="Open Steam profile"
                className="h-12 w-full rounded-xl bg-lime-400 px-5 text-sm font-semibold text-slate-950 hover:bg-lime-300 md:w-auto"
                type="submit"
              >
                Open profile
              </button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
              onClick={() => setSteamId(DEMO_STEAM_ID)}
              type="button"
            >
              Use demo Steam ID
            </button>
            <button
              className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
              onClick={() => router.push(`/profiles/${DEMO_STEAM_ID}`)}
              type="button"
            >
              Open seeded profile
            </button>
          </div>
        </SectionCard>

        <div className="grid gap-4">
          <ActionPanel
            actions={
              <>
                <Link
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                  href="/games"
                >
                  Browse games
                </Link>
                <Link
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                  href="/leaderboards"
                >
                  View leaderboards
                </Link>
              </>
            }
            eyebrow="Steam-only focus"
            title="What this app makes explicit"
          >
            <ul className="space-y-2">
              <li>Full achievement progress depends on Steam exposing player unlock state.</li>
              <li>Metadata-only games are explained as unknown progress, not locked progress.</li>
              <li>Targets, dashboard actions, comments, and publishing flows require Steam sign-in.</li>
            </ul>
          </ActionPanel>
          <ActionPanel
            actions={
              currentUser.data ? (
                <Link
                  className="rounded-xl bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
                  href="/dashboard"
                >
                  Open your command center
                </Link>
              ) : (
                <a
                  className="rounded-xl bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
                  href={buildSignInUrl('/dashboard')}
                >
                  Sign in for dashboard tools
                </a>
              )
            }
            eyebrow="Next step"
            title="Signed-in command center"
          >
            Dashboard keeps active targets, next targets, sync attention, recent activity,
            session suggestions, and guide suggestions in one place.
          </ActionPanel>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <EntityLinkCard
          description="Browse tracked Steam games, metadata states, playtime, and completion trends."
          eyebrow="Explore"
          href="/games"
          title="Games"
        />
        <EntityLinkCard
          description="Rank stored profile snapshots by completion, unlocked achievements, and rare unlock prestige."
          eyebrow="Compare"
          href="/leaderboards"
          title="Leaderboards"
        />
        <EntityLinkCard
          description="Read published roadmaps and cleanup guides for tracked Steam games."
          eyebrow="Learn"
          href="/games/910001/guides"
          title="Guides"
        />
        <EntityLinkCard
          description="Find or host co-op and boosting sessions for target achievements."
          eyebrow="Coordinate"
          href="/sessions"
          title="Sessions"
        />
        <EntityLinkCard
          description="Scan public platform activity, milestone moments, and recent community movement."
          eyebrow="Monitor"
          href="/activity"
          title="Activity"
        />
        <EntityLinkCard
          description="Review milestone-derived badges and the reward ladder across the tracker."
          eyebrow="Showcase"
          href="/badges"
          title="Badges"
        />
      </section>
    </PageShell>
  );
}
