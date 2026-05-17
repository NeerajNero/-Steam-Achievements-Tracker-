import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { PublicProfileView } from '@/features/public-profile/components/public-profile-view';

export const metadata: Metadata = {
  title: 'Public Profile | Steam Achievement Tracker',
};

export default async function PublicProfilePage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>): Promise<ReactNode> {
  const { slug } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8">
      <PublicProfileView slug={slug} />
    </main>
  );
}
