'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { AuthStatus } from '@/features/auth/components/auth-status';

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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-4 px-5 py-10">
      <AuthStatus />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-slate-500">
          Local MVP
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 md:text-4xl">
          Steam Achievement Tracker
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Open a stored Steam profile dashboard, review seeded progress, and
          enqueue backend sync jobs through the generated API SDK.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
          <li>Real Steam profiles must be public for full sync.</li>
          <li>
            Achievement unlock state may be unknown if Steam denies player
            achievement access.
          </li>
          <li>Sync jobs are queued, and status appears in the sync runs.</li>
        </ul>

        <form className="mt-8 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Steam ID</span>
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              inputMode="numeric"
              name="steamId"
              onChange={(event) => setSteamId(event.target.value)}
              placeholder="76561198000000000"
              value={steamId}
            />
          </label>
          <div className="flex items-end">
            <button
              className="h-11 w-full rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 md:w-auto"
              type="submit"
            >
              Open Profile
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setSteamId(DEMO_STEAM_ID)}
            type="button"
          >
            Use demo profile
          </button>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => router.push(`/profiles/${DEMO_STEAM_ID}`)}
            type="button"
          >
            Open seeded dashboard
          </button>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => router.push('/games')}
            type="button"
          >
            Browse tracked games
          </button>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => router.push('/leaderboards')}
            type="button"
          >
            View leaderboards
          </button>
        </div>
      </section>
    </main>
  );
}
