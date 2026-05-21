'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { EntityLinkCard } from '@/components/ui/entity-link-card';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';

const DEMO_STEAM_ID = '76561198000000000';

export default function HomePage() {
  const router = useRouter();
  const [steamId, setSteamId] = useState(DEMO_STEAM_ID);

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
            <Link
              className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
              href="/dashboard"
            >
              Open dashboard
            </Link>
            <Link
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              href={`/profiles/${DEMO_STEAM_ID}`}
            >
              Try demo profile
            </Link>
          </>
        }
        eyebrow="Steam-only achievement hunting"
        title="Track completions, plan targets, and decide the next 100% faster."
      >
        <p>
          This Steam-only dashboard keeps synced profiles, tracked games, targets,
          leaderboards, guides, sessions, activity, milestones, badges, and public
          showcase pages in one place. It is built to answer what to do next, what
          data is still missing, and which actions require sign-in.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="accent">Steam-only</StatusBadge>
          <StatusBadge tone="info">Queued sync runs</StatusBadge>
          <StatusBadge tone="warning">Unknown unlock state stays unknown</StatusBadge>
        </div>
      </PageHero>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <SectionCard
          description="Paste a stored Steam ID, open the seeded demo profile, or jump into the signed-in command center."
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
                className="h-12 w-full rounded-xl bg-lime-400 px-5 text-sm font-semibold text-slate-950 hover:bg-lime-300 md:w-auto"
                type="submit"
              >
                Open Profile
              </button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
              onClick={() => setSteamId(DEMO_STEAM_ID)}
              type="button"
            >
              Use demo profile
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

        <SectionCard
          description="What this app will and will not assume from Steam."
          title="How The Data Reads"
        >
          <ul className="space-y-3 text-sm leading-6 text-slate-300">
            <li>Full achievement progress depends on Steam exposing player unlock state.</li>
            <li>Metadata-only achievements are explained as unknown, never shown as locked.</li>
            <li>Targets, dashboard actions, and account pages require a Steam sign-in.</li>
          </ul>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <EntityLinkCard
          description="Browse tracked Steam games, metadata states, playtime, and completion trends."
          eyebrow="Explore"
          href="/games"
          title="Games"
        />
        <EntityLinkCard
          description="Rank stored profile snapshots by completion, unlocked achievements, and more."
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
