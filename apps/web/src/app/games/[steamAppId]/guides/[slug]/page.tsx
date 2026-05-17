'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { PageShell } from '@/components/layout/page-shell';
import { ErrorState, LoadingState } from '@/components/ui/panel-state';
import { GuideCommunitySection } from '@/features/community/components/guide-community-section';
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
    <PageShell maxWidth="max-w-5xl">
      <div className="mb-4">
        <Link
          className="text-sm font-medium text-lime-200 hover:text-lime-100"
          href={`/games/${steamAppId}/guides`}
        >
          Back to guides
        </Link>
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
      {guide.data ? (
        <div className="grid gap-6">
          <GuideDetail guide={guide.data} />
          <GuideCommunitySection guideId={guide.data.id} />
        </div>
      ) : null}
    </PageShell>
  );
}
