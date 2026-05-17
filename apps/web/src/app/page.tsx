'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
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
      <div className="grid gap-6">
        <PageHero
          actions={<StatusBadge tone="accent">Steam-only</StatusBadge>}
          eyebrow="Achievement hunting platform"
          title="Track completions, compare progress, and plan the next 100%."
        >
          <p>
            A local Steam dashboard for synced profiles, tracked games,
            leaderboards, guides, sessions, activity, milestones, badges, and
            public showcase pages.
          </p>
        </PageHero>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <SectionCard
            description="Open a stored profile by Steam ID or jump into the seeded demo."
            title="Find a Steam profile"
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
                Open seeded dashboard
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Data rules">
            <ul className="space-y-3 text-sm leading-6 text-slate-300">
              <li>Real Steam profiles must be public for full sync.</li>
              <li>Unknown unlock state is shown as unknown, never as locked.</li>
              <li>Sync jobs are queued and tracked through sync runs.</li>
            </ul>
          </SectionCard>
        </section>

        <ResponsiveGrid>
          {[
            ['Games', 'Browse tracked Steam games and achievement metadata.', '/games'],
            ['Leaderboards', 'Rank latest profile snapshots by completion stats.', '/leaderboards'],
            ['Guides', 'Read community roadmaps for the seeded demo game.', '/games/910001/guides'],
            ['Sessions', 'Find upcoming co-op and achievement boosting sessions.', '/sessions'],
            ['Activity', 'Scan public platform events and milestone moments.', '/activity'],
            ['Badges', 'Review milestone-derived badge definitions.', '/badges'],
          ].map(([title, description, href]) => (
            <Link
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-lime-300/40 hover:bg-slate-900"
              href={href}
              key={href}
            >
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </Link>
          ))}
        </ResponsiveGrid>
      </div>
    </PageShell>
  );
}
