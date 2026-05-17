import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { PageShell } from '@/components/layout/page-shell';
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
    <PageShell maxWidth="max-w-5xl">
      <PublicProfileView slug={slug} />
    </PageShell>
  );
}
