import type { DashboardGuideResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime } from '@/lib/format';

export function DashboardGuides({
  authored,
  suggested,
}: Readonly<{
  authored: readonly DashboardGuideResponseDto[];
  suggested: readonly DashboardGuideResponseDto[];
}>): ReactNode {
  const hasGuides = authored.length > 0 || suggested.length > 0;

  return (
    <SectionCard
      actions={
        <Link
          className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          href="/account/guides"
        >
          Your guides
        </Link>
      }
      description="Guides you authored and public guides for games you own or recently played."
      title="Guides"
    >
      {!hasGuides ? (
        <EmptyState
          message="No guide suggestions yet. Sync games or browse guides."
          title="No guide matches"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <GuideColumn items={authored} title="Your guides" />
          <GuideColumn items={suggested} title="For your library" />
        </div>
      )}
    </SectionCard>
  );
}

function GuideColumn({
  items,
  title,
}: Readonly<{
  items: readonly DashboardGuideResponseDto[];
  title: string;
}>): ReactNode {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          Nothing to show here yet.
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          {items.map((guide) => (
            <Link
              className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-lime-300/40 hover:bg-lime-300/5"
              href={`/games/${guide.steamAppId}/guides/${guide.slug}`}
              key={guide.id}
            >
              <div className="flex items-start gap-3">
                {guide.gameIconUrl ? (
                  <img
                    alt=""
                    className="h-10 w-10 rounded-lg border border-white/10"
                    src={guide.gameIconUrl}
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{guide.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{guide.gameName}</p>
                </div>
              </div>
              {guide.summary ? (
                <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                  {guide.summary}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone={guide.status === 'published' ? 'success' : 'default'}>
                  {guide.status}
                </StatusBadge>
                <StatusBadge tone="info">{guide.visibility}</StatusBadge>
                {guide.publishedAt ? (
                  <span className="text-xs text-slate-500">
                    {formatDateTime(guide.publishedAt)}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
