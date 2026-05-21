import Link from 'next/link';
import type { ReactNode } from 'react';

import type { DashboardNextTargetResponseDto } from '@steam-achievement/client-sdk';
import { EmptyState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatPercent, formatPlaytime } from '@/lib/format';

import { getTargetReason, getTargetTypeLabel } from '../utils/dashboard-labels';

export function NextTargets({
  targets,
}: Readonly<{
  targets: readonly DashboardNextTargetResponseDto[];
}>): ReactNode {
  return (
    <SectionCard
      description="Deterministic suggestions from your stored Steam progress, guides, sessions, and metadata state."
      title="Next Best Targets"
    >
      {targets.length === 0 ? (
        <EmptyState
          message="No targets yet. Sync achievements to find close completions."
          title="No targets found"
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {targets.map((target) => (
            <Link
              className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-lime-300/40 hover:bg-lime-300/5"
              href={target.href}
              key={`${target.type}-${target.href}`}
            >
              <div className="flex items-start gap-3">
                {target.game.iconUrl ? (
                  <img
                    alt=""
                    className="h-12 w-12 rounded-xl border border-white/10"
                    src={target.game.iconUrl}
                  />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-slate-900 text-xs font-semibold text-slate-400">
                    SA
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="accent">
                      {getTargetTypeLabel(target.type)}
                    </StatusBadge>
                    <span className="text-xs text-slate-500">
                      {formatPlaytime(target.game.playtimeMinutes)}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate font-semibold text-white">
                    {target.game.name}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {getTargetReason(target)}
                  </p>
                  {target.game.achievementDataState === 'unlock_state_synced' ? (
                    <div className="mt-3">
                      <ProgressBar value={target.game.completionPercentage} />
                      <div className="mt-1 flex justify-between text-xs text-slate-500">
                        <span>{formatPercent(target.game.completionPercentage)}</span>
                        <span>{target.game.remainingAchievements} remaining</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
