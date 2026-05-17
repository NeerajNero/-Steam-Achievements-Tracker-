import type { ProfileMilestoneResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

export function MilestoneCard({
  milestone,
}: Readonly<{
  milestone: ProfileMilestoneResponseDto;
}>): ReactNode {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{milestone.title}</p>
          {milestone.description ? (
            <p className="mt-1 text-sm text-slate-400">{milestone.description}</p>
          ) : null}
          {milestone.thresholdValue ? (
            <p className="mt-2 text-xs font-medium uppercase tracking-normal text-slate-500">
              Threshold {milestone.thresholdValue}
            </p>
          ) : null}
        </div>
        <time className="text-xs text-slate-500" dateTime={milestone.achievedAt}>
          {formatDate(milestone.achievedAt)}
        </time>
      </div>
    </article>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value));
}
