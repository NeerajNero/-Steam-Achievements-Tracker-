import type { ReactNode } from 'react';
import type { GuideDetailResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { formatDateTime } from '@/lib/format';

import { GuideStatusBadge } from './guide-status-badge';

export function GuideDetail({
  guide,
}: Readonly<{
  guide: GuideDetailResponseDto;
}>): ReactNode {
  return (
    <article className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.2),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/30 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-lime-200">
              {guide.game.name} guide
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">
              {guide.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              {guide.summary ?? 'No summary provided.'}
            </p>
          </div>
          <GuideStatusBadge status={guide.status} />
        </div>
        <dl className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="font-medium text-slate-500">Difficulty</dt>
            <dd>{guide.estimatedDifficulty ?? 'Not set'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Estimated hours</dt>
            <dd>{guide.estimatedHours ?? 'Not set'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Spoilers</dt>
            <dd>{guide.isSpoilerHeavy ? 'Spoiler heavy' : 'Light'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Published</dt>
            <dd>{formatDateTime(guide.publishedAt)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
            Roadmap
          </span>
          <span className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
            Cleanup planning
          </span>
          {guide.isSpoilerHeavy ? (
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">
              Spoiler heavy
            </span>
          ) : null}
        </div>
      </section>

      <SectionCard description="Read the route, cleanup order, and any spoiler notes section by section." title="Roadmap Sections">
        {guide.sections.length === 0 ? (
          <EmptyState message="This guide has no sections yet." />
        ) : (
          <div className="divide-y divide-white/10">
            {guide.sections.map((section) => (
              <section className="p-4" key={section.id}>
                <h3 className="text-lg font-semibold text-white">
                  {section.title}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard description="Achievements attached to this guide stay visible while planning routes or cleanup passes." title="Covered Achievements">
        {guide.achievements.length === 0 ? (
          <EmptyState message="No achievements are attached to this guide yet." />
        ) : (
          <div className="divide-y divide-white/10">
            {guide.achievements.map((achievement) => (
              <div className="flex gap-3 p-4" key={achievement.id}>
                {achievement.iconUrl ? (
                  <img
                    alt=""
                    className="h-10 w-10 rounded-xl border border-white/10"
                    src={achievement.iconUrl}
                  />
                ) : null}
                <div>
                  <h3 className="font-medium text-white">
                    {achievement.displayName ?? achievement.apiName}
                  </h3>
                  {achievement.description ? (
                    <p className="mt-1 text-sm text-slate-400">
                      {achievement.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    Global rarity:{' '}
                    {achievement.globalPercentage === null ||
                    achievement.globalPercentage === undefined
                      ? 'Unknown'
                      : `${achievement.globalPercentage.toFixed(1)}%`}
                    {achievement.hidden ? ' · Hidden' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </article>
  );
}
