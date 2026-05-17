import type { ReactNode } from 'react';
import type { GuideDetailResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState } from '@/components/ui/panel-state';
import { formatDateTime } from '@/lib/format';

import { GuideStatusBadge } from './guide-status-badge';

export function GuideDetail({
  guide,
}: Readonly<{
  guide: GuideDetailResponseDto;
}>): ReactNode {
  return (
    <article className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {guide.game.name} guide
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
              {guide.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {guide.summary ?? 'No summary provided.'}
            </p>
          </div>
          <GuideStatusBadge status={guide.status} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-4">
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
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-950">Roadmap sections</h2>
        </div>
        {guide.sections.length === 0 ? (
          <EmptyState message="This guide has no sections yet." />
        ) : (
          <div className="divide-y divide-slate-200">
            {guide.sections.map((section) => (
              <section className="p-4" key={section.id}>
                <h3 className="text-lg font-semibold text-slate-950">
                  {section.title}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-950">Covered achievements</h2>
        </div>
        {guide.achievements.length === 0 ? (
          <EmptyState message="No achievements are attached to this guide yet." />
        ) : (
          <div className="divide-y divide-slate-200">
            {guide.achievements.map((achievement) => (
              <div className="flex gap-3 p-4" key={achievement.id}>
                {achievement.iconUrl ? (
                  <img
                    alt=""
                    className="h-10 w-10 rounded border border-slate-200"
                    src={achievement.iconUrl}
                  />
                ) : null}
                <div>
                  <h3 className="font-medium text-slate-950">
                    {achievement.displayName ?? achievement.apiName}
                  </h3>
                  {achievement.description ? (
                    <p className="mt-1 text-sm text-slate-600">
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
      </section>
    </article>
  );
}
