'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { useGuide } from '@/features/guides/api/use-guide';
import { GuideDetail } from '@/features/guides/components/guide-detail';
import { getErrorMessage, getHttpStatus } from '@/lib/format';

export default function GameGuideDetailPage() {
  const params = useParams<{ steamAppId: string; slug: string }>();
  const steamAppId = Number(params.steamAppId);
  const slug = decodeURIComponent(params.slug);
  const guide = useGuide(steamAppId, slug);
  const isMissing = getHttpStatus(guide.error) === 404;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          className="text-sm font-medium text-blue-700"
          href={`/games/${steamAppId}/guides`}
        >
          Back to guides
        </Link>
        <AuthStatus />
      </div>

      {guide.isLoading ? <LoadingState message="Loading guide..." /> : null}
      {isMissing ? (
        <ErrorState
          message="This guide is not published, public, or available for this game."
          title="Guide not found"
        />
      ) : null}
      {!isMissing && guide.isError ? (
        <ErrorState message={getErrorMessage(guide.error)} title="Guide unavailable" />
      ) : null}
      {guide.data ? <GuideDetail guide={guide.data} /> : null}
    </main>
  );
}
