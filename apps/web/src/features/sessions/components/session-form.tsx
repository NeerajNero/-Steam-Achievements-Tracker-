'use client';

import type {
  CreateGamingSessionDto,
  GamingSessionDetailResponseDto,
  UpdateGamingSessionDto,
} from '@steam-achievement/client-sdk';
import type { FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';

export interface SessionFormValues {
  title: string;
  description: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  timezone: string;
  maxParticipants: number;
  visibility: 'public' | 'unlisted' | 'private';
  externalVoiceUrl: string;
  status?: 'open' | 'full' | 'completed' | 'cancelled';
}

export function SessionForm({
  initialSession,
  isSubmitting,
  mode,
  onSubmit,
}: Readonly<{
  initialSession?: GamingSessionDetailResponseDto;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  onSubmit: (values: SessionFormValues) => void;
}>): ReactNode {
  const defaults = useMemo(() => getInitialValues(initialSession), [initialSession]);
  const [values, setValues] = useState<SessionFormValues>(defaults);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit(values);
  }

  const labelClassName = 'grid gap-1 text-sm font-medium text-slate-300';
  const inputClassName =
    'rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-lime-400';

  return (
    <form
      className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20"
      onSubmit={handleSubmit}
    >
      <label className={labelClassName}>
        Title
        <input
          className={inputClassName}
          maxLength={120}
          minLength={3}
          onChange={(event) =>
            setValues((current) => ({ ...current, title: event.target.value }))
          }
          required
          value={values.title}
        />
      </label>

      <label className={labelClassName}>
        Description
        <textarea
          className={`${inputClassName} min-h-24`}
          maxLength={1000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          value={values.description}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClassName}>
          Start
          <input
            className={inputClassName}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                scheduledStartAt: event.target.value,
              }))
            }
            required
            type="datetime-local"
            value={values.scheduledStartAt}
          />
        </label>
        <label className={labelClassName}>
          End
          <input
            className={inputClassName}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                scheduledEndAt: event.target.value,
              }))
            }
            type="datetime-local"
            value={values.scheduledEndAt}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={labelClassName}>
          Timezone
          <input
            className={inputClassName}
            maxLength={100}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                timezone: event.target.value,
              }))
            }
            value={values.timezone}
          />
        </label>
        <label className={labelClassName}>
          Max participants
          <input
            className={inputClassName}
            max={100}
            min={2}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                maxParticipants: Number(event.target.value),
              }))
            }
            type="number"
            value={values.maxParticipants}
          />
        </label>
        <label className={labelClassName}>
          Visibility
          <select
            className={inputClassName}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                visibility: event.target.value as SessionFormValues['visibility'],
              }))
            }
            value={values.visibility}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </label>
      </div>

      {mode === 'edit' ? (
        <label className={labelClassName}>
          Status
          <select
            className={inputClassName}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                status: event.target.value as SessionFormValues['status'],
              }))
            }
            value={values.status}
          >
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      ) : null}

      <label className={labelClassName}>
        Voice URL
        <input
          className={inputClassName}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              externalVoiceUrl: event.target.value,
            }))
          }
          type="url"
          value={values.externalVoiceUrl}
        />
      </label>

      <div>
        <button
          className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? 'Saving...'
            : mode === 'create'
              ? 'Create session'
              : 'Save session'}
        </button>
      </div>
    </form>
  );
}

export function toCreateSessionDto(
  values: SessionFormValues,
): CreateGamingSessionDto {
  return {
    title: values.title.trim(),
    description: emptyToUndefined(values.description),
    scheduledStartAt: new Date(values.scheduledStartAt).toISOString(),
    scheduledEndAt: values.scheduledEndAt
      ? new Date(values.scheduledEndAt).toISOString()
      : undefined,
    timezone: emptyToUndefined(values.timezone),
    maxParticipants: values.maxParticipants,
    visibility: values.visibility,
    externalVoiceUrl: emptyToUndefined(values.externalVoiceUrl),
  };
}

export function toUpdateSessionDto(
  values: SessionFormValues,
): UpdateGamingSessionDto {
  return {
    ...toCreateSessionDto(values),
    status: values.status,
  };
}

function getInitialValues(
  session?: GamingSessionDetailResponseDto,
): SessionFormValues {
  const defaultStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    title: session?.title ?? '',
    description: session?.description ?? '',
    scheduledStartAt: toLocalDateTimeInput(session?.scheduledStartAt ?? defaultStart),
    scheduledEndAt:
      session?.scheduledEndAt === null || session?.scheduledEndAt === undefined
        ? ''
        : toLocalDateTimeInput(session.scheduledEndAt),
    timezone:
      session?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    maxParticipants: session?.maxParticipants ?? 4,
    visibility:
      session?.visibility === 'unlisted' || session?.visibility === 'private'
        ? session.visibility
        : 'public',
    externalVoiceUrl: session?.externalVoiceUrl ?? '',
    status:
      session?.status === 'full' ||
      session?.status === 'completed' ||
      session?.status === 'cancelled'
        ? session.status
        : 'open',
  };
}

function toLocalDateTimeInput(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
