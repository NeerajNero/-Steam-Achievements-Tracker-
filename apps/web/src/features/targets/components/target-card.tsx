'use client';

import {
  AccountTargetResponseDtoTypeEnum,
  type AccountTargetResponseDto,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/format';

import { useArchiveAchievementTarget } from '../api/use-archive-achievement-target';
import { useArchiveGameTarget } from '../api/use-archive-game-target';
import {
  getStatusLabel,
  getStatusTone,
  getTargetSubtitle,
  getTargetTitle,
} from '../utils/target-labels';
import { PriorityBadge } from './priority-badge';
import { TargetForm } from './target-form';

export function TargetCard({
  compact = false,
  target,
}: Readonly<{
  compact?: boolean;
  target: AccountTargetResponseDto;
}>): ReactNode {
  const archiveGameTarget = useArchiveGameTarget();
  const archiveAchievementTarget = useArchiveAchievementTarget();
  const isPending = archiveGameTarget.isPending || archiveAchievementTarget.isPending;
  const gameHref = `/games/${target.game.steamAppId}`;
  const detailHref =
    target.type === AccountTargetResponseDtoTypeEnum.Achievement
      ? `/games/${target.game.steamAppId}`
      : gameHref;

  function archive(): void {
    if (target.type === AccountTargetResponseDtoTypeEnum.Game) {
      archiveGameTarget.mutate(target.id);
      return;
    }

    archiveAchievementTarget.mutate(target.id);
  }

  return (
    <article className={`rounded-[22px] border border-white/10 bg-white/[0.03] ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={target.priority} />
            <StatusBadge tone={getStatusTone(target.status)}>
              {getStatusLabel(target.status)}
            </StatusBadge>
            {target.type === AccountTargetResponseDtoTypeEnum.Achievement ? (
              <StatusBadge tone="default">Achievement</StatusBadge>
            ) : (
              <StatusBadge tone="default">Game</StatusBadge>
            )}
            {target.dueDate ? (
              <StatusBadge tone="warning">Due {formatDate(target.dueDate)}</StatusBadge>
            ) : null}
          </div>
          <Link
            className="mt-3 block text-base font-semibold text-white hover:text-lime-200"
            href={detailHref}
          >
            {getTargetTitle(target)}
          </Link>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {getTargetSubtitle(target)}
          </p>
        </div>
        {compact ? null : (
          <button
            className="rounded-full border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
            disabled={isPending}
            onClick={archive}
            type="button"
          >
            {isPending ? 'Archiving...' : 'Archive'}
          </button>
        )}
      </div>
      {target.notes ? <p className="mt-3 text-sm leading-6 text-slate-300">{target.notes}</p> : null}
      {compact ? (
        <>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>{target.type === AccountTargetResponseDtoTypeEnum.Achievement ? 'Achievement target' : 'Game target'}</span>
            {target.targetCompletionPercentage !== undefined &&
            target.targetCompletionPercentage !== null ? (
              <span>Target {target.targetCompletionPercentage}%</span>
            ) : null}
            <span>Created {formatDate(target.createdAt)}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex text-sm font-medium text-lime-200 hover:text-lime-100"
              href={gameHref}
            >
              Open {target.game.name}
            </Link>
            <button
              className="inline-flex text-sm font-medium text-slate-400 hover:text-white disabled:opacity-60"
              disabled={isPending}
              onClick={archive}
              type="button"
            >
              {isPending ? 'Archiving...' : 'Archive'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300 md:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Linked game
              </p>
              <p className="mt-1 font-medium text-white">{target.game.name}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Target type
              </p>
              <p className="mt-1">
                {target.type === AccountTargetResponseDtoTypeEnum.Achievement
                  ? 'Single achievement'
                  : 'Whole game completion'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Progress rule
              </p>
              <p className="mt-1">
                {target.targetCompletionPercentage !== undefined &&
                target.targetCompletionPercentage !== null
                  ? `Complete at ${target.targetCompletionPercentage}%`
                  : 'Complete at 100%'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            {target.targetCompletionPercentage !== undefined &&
            target.targetCompletionPercentage !== null ? (
              <span>Target: {target.targetCompletionPercentage}%</span>
            ) : null}
            <span>Created: {formatDate(target.createdAt)}</span>
          </div>
          <div className="mt-3">
            <Link
              className="inline-flex text-sm font-medium text-lime-200 hover:text-lime-100"
              href={gameHref}
            >
              Open {target.game.name}
            </Link>
          </div>
        </>
      )}
      {compact ? null : <TargetForm target={target} />}
    </article>
  );
}
