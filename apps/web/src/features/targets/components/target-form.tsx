'use client';

import {
  AccountTargetResponseDtoPriorityEnum,
  AccountTargetResponseDtoStatusEnum,
  AccountTargetResponseDtoTypeEnum,
  UpdateAchievementTargetDtoPriorityEnum,
  UpdateAchievementTargetDtoStatusEnum,
  UpdateGameTargetDtoPriorityEnum,
  UpdateGameTargetDtoStatusEnum,
  type AccountTargetResponseDto,
} from '@steam-achievement/client-sdk';
import { useState, type FormEvent, type ReactNode } from 'react';

import { useUpdateAchievementTarget } from '../api/use-update-achievement-target';
import { useUpdateGameTarget } from '../api/use-update-game-target';

export function TargetForm({
  target,
}: Readonly<{
  target: AccountTargetResponseDto;
}>): ReactNode {
  const [priority, setPriority] = useState(target.priority);
  const [status, setStatus] = useState(target.status);
  const [notes, setNotes] = useState(target.notes ?? '');
  const [dueDate, setDueDate] = useState(formatDateInputValue(target.dueDate));
  const [targetCompletionPercentage, setTargetCompletionPercentage] = useState(
    target.targetCompletionPercentage?.toString() ?? '',
  );
  const updateGameTarget = useUpdateGameTarget();
  const updateAchievementTarget = useUpdateAchievementTarget();
  const isPending = updateGameTarget.isPending || updateAchievementTarget.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (target.type === AccountTargetResponseDtoTypeEnum.Game) {
      updateGameTarget.mutate({
        targetId: target.id,
        updateGameTargetDto: {
          dueDate: parseDateInputValue(dueDate),
          notes: notes.trim() === '' ? null : notes.trim(),
          priority: priority as unknown as UpdateGameTargetDtoPriorityEnum,
          status: status as unknown as UpdateGameTargetDtoStatusEnum,
          targetCompletionPercentage:
            targetCompletionPercentage.trim() === ''
              ? null
              : Number(targetCompletionPercentage),
        },
      });
      return;
    }

    updateAchievementTarget.mutate({
      targetId: target.id,
      updateAchievementTargetDto: {
        dueDate: parseDateInputValue(dueDate),
        notes: notes.trim() === '' ? null : notes.trim(),
        priority: priority as unknown as UpdateAchievementTargetDtoPriorityEnum,
        status: status as unknown as UpdateAchievementTargetDtoStatusEnum,
      },
    });
  }

  return (
    <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Priority
        <select
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm normal-case text-white"
          onChange={(event) =>
            setPriority(event.target.value as AccountTargetResponseDtoPriorityEnum)
          }
          value={priority}
        >
          {Object.values(AccountTargetResponseDtoPriorityEnum).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Status
        <select
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm normal-case text-white"
          onChange={(event) =>
            setStatus(event.target.value as AccountTargetResponseDtoStatusEnum)
          }
          value={status}
        >
          {Object.values(AccountTargetResponseDtoStatusEnum)
            .filter((value) => value !== AccountTargetResponseDtoStatusEnum.Archived)
            .map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
        Notes
        <textarea
          className="min-h-20 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm normal-case text-white"
          maxLength={1000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional target notes"
          value={notes}
        />
      </label>
      {target.type === AccountTargetResponseDtoTypeEnum.Game ? (
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Target %
          <input
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm normal-case text-white"
            max={100}
            min={0}
            onChange={(event) => setTargetCompletionPercentage(event.target.value)}
            placeholder="100"
            step={1}
            type="number"
            value={targetCompletionPercentage}
          />
        </label>
      ) : null}
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Due date
        <input
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm normal-case text-white"
          onChange={(event) => setDueDate(event.target.value)}
          type="date"
          value={dueDate}
        />
      </label>
      <button
        className="self-end rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}

function formatDateInputValue(value: Date | null | undefined): string {
  if (value === undefined || value === null) {
    return '';
  }

  return value.toISOString().slice(0, 10);
}

function parseDateInputValue(value: string): Date | null {
  if (value.trim() === '') {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}
