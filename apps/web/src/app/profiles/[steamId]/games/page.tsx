import Link from 'next/link';
import { use } from 'react';

import { PageShell } from '@/components/layout/page-shell';
import { EmptyState } from '@/components/ui/panel-state';

export default function ProfileGamesRedirectPage({
  params,
}: Readonly<{
  params: Promise<{ steamId: string }>;
}>) {
  const { steamId } = use(params);

  return (
    <PageShell maxWidth="max-w-3xl">
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          action={
            <Link
              className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
              href={`/profiles/${steamId}`}
            >
              Back to profile
            </Link>
          }
          message="Pick a game from the profile library to open a Steam game detail page."
          title="Choose a game"
        />
      </div>
    </PageShell>
  );
}
