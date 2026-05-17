'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { useGameGuides } from '@/features/guides/api/use-game-guides';
import { GuideList } from '@/features/guides/components/guide-list';

export default function GameGuidesPage() {
  const params = useParams<{ steamAppId: string }>();
  const steamAppId = Number(params.steamAppId);
  const guides = useGameGuides(steamAppId, { limit: 20, offset: 0 });

  return (
    <PageShell maxWidth="max-w-5xl">
      <div className="mb-4">
        <Link className="text-sm font-medium text-lime-200 hover:text-lime-100" href={`/games/${steamAppId}`}>
          Back to game
        </Link>
      </div>

      <div className="mb-6">
        <PageHero
          actions={
            <Link
              className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
              href={`/games/${steamAppId}/guides/new`}
            >
              New guide
            </Link>
          }
          eyebrow={`Steam App ${steamAppId}`}
          title="Steam game guides"
        >
          <p>
            Published public roadmaps for Steam App {steamAppId}.
          </p>
        </PageHero>
      </div>

      <GuideList
        error={guides.error}
        isError={guides.isError}
        isLoading={guides.isLoading}
        items={guides.data?.items}
      />
    </PageShell>
  );
}
