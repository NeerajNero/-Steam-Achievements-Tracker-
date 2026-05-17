'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AuthStatus } from '@/features/auth/components/auth-status';
import { useGameGuides } from '@/features/guides/api/use-game-guides';
import { GuideList } from '@/features/guides/components/guide-list';

export default function GameGuidesPage() {
  const params = useParams<{ steamAppId: string }>();
  const steamAppId = Number(params.steamAppId);
  const guides = useGameGuides(steamAppId, { limit: 20, offset: 0 });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-700" href={`/games/${steamAppId}`}>
          Back to game
        </Link>
        <AuthStatus />
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Steam game guides
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Published public roadmaps for Steam App {steamAppId}.
          </p>
        </div>
        <Link
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          href={`/games/${steamAppId}/guides/new`}
        >
          New guide
        </Link>
      </div>

      <GuideList
        error={guides.error}
        isError={guides.isError}
        isLoading={guides.isLoading}
        items={guides.data?.items}
      />
    </main>
  );
}
