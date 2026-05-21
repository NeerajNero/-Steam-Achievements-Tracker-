'use client';

import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import type { CreateGuideDto, UpdateGuideDto } from '@steam-achievement/client-sdk';

export interface GuideFormValues {
  title: string;
  summary: string;
  visibility: 'public' | 'unlisted' | 'private';
  estimatedDifficulty: string;
  estimatedHours: string;
  isSpoilerHeavy: boolean;
  status?: 'draft' | 'published' | 'archived';
}

export function GuideForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel,
  showStatus = false,
}: Readonly<{
  initialValues?: Partial<GuideFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: GuideFormValues) => void;
  submitLabel: string;
  showStatus?: boolean;
}>): ReactNode {
  const [values, setValues] = useState<GuideFormValues>({
    title: initialValues?.title ?? '',
    summary: initialValues?.summary ?? '',
    visibility: initialValues?.visibility ?? 'public',
    estimatedDifficulty: initialValues?.estimatedDifficulty ?? '',
    estimatedHours: initialValues?.estimatedHours ?? '',
    isSpoilerHeavy: initialValues?.isSpoilerHeavy ?? false,
    status: initialValues?.status ?? 'draft',
  });

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit(values);
  }

  const labelClassName = 'grid gap-1 text-sm font-medium text-slate-300';
  const inputClassName =
    'rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-lime-400';

  return (
    <form
      className="grid gap-5 rounded-[24px] border border-white/10 bg-slate-950/75 p-6 shadow-xl shadow-black/20"
      onSubmit={submit}
    >
      <div>
        <h2 className="text-lg font-semibold text-white">Guide details</h2>
        <p className="mt-1 text-sm text-slate-400">
          Explain what the route is for, how hard it is, and how much spoiler risk it carries.
        </p>
      </div>
      <label className={labelClassName}>
        Title
        <input
          className={inputClassName}
          maxLength={120}
          minLength={3}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
          required
          value={values.title}
        />
      </label>

      <label className={labelClassName}>
        Summary
        <textarea
          className={`${inputClassName} min-h-24`}
          maxLength={500}
          onChange={(event) => setValues({ ...values, summary: event.target.value })}
          value={values.summary}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className={labelClassName}>
          Visibility
          <select
            className={inputClassName}
            onChange={(event) =>
              setValues({
                ...values,
                visibility: event.target.value as GuideFormValues['visibility'],
              })
            }
            value={values.visibility}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </label>

        <label className={labelClassName}>
          Difficulty
          <input
            className={inputClassName}
            max={10}
            min={1}
            onChange={(event) =>
              setValues({ ...values, estimatedDifficulty: event.target.value })
            }
            type="number"
            value={values.estimatedDifficulty}
          />
        </label>

        <label className={labelClassName}>
          Estimated hours
          <input
            className={inputClassName}
            min={0}
            onChange={(event) =>
              setValues({ ...values, estimatedHours: event.target.value })
            }
            type="number"
            value={values.estimatedHours}
          />
        </label>
      </div>

      {showStatus ? (
        <label className={labelClassName}>
          Status
          <select
            className={inputClassName}
            onChange={(event) =>
              setValues({
                ...values,
                status: event.target.value as GuideFormValues['status'],
              })
            }
            value={values.status}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      ) : null}

      <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <input
          checked={values.isSpoilerHeavy}
          onChange={(event) =>
            setValues({ ...values, isSpoilerHeavy: event.target.checked })
          }
          type="checkbox"
        />
        Spoiler heavy
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="text-sm text-slate-500">
          Public and unlisted guides become readable from the game hub once published.
        </p>
        <button
          className="w-fit rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function toCreateGuideDto(values: GuideFormValues): CreateGuideDto {
  return {
    title: values.title,
    summary: values.summary || undefined,
    visibility: values.visibility,
    estimatedDifficulty: parseOptionalNumber(values.estimatedDifficulty),
    estimatedHours: parseOptionalNumber(values.estimatedHours),
    isSpoilerHeavy: values.isSpoilerHeavy,
  };
}

export function toUpdateGuideDto(values: GuideFormValues): UpdateGuideDto {
  return {
    ...toCreateGuideDto(values),
    status: values.status,
  };
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim().length === 0) {
    return undefined;
  }

  return Number(value);
}
