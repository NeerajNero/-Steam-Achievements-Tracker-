import Link from 'next/link';
import { use } from 'react';

export default function ProfileGamesRedirectPage({
  params,
}: Readonly<{
  params: Promise<{ steamId: string }>;
}>) {
  const { steamId } = use(params);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold text-slate-950">Game Detail Route</h1>
      <p className="max-w-xl text-slate-600">
        Pick a game from the profile library to open a game detail page.
      </p>
      <Link className="text-sm font-medium text-blue-700" href={`/profiles/${steamId}`}>
        Back to profile
      </Link>
    </main>
  );
}

