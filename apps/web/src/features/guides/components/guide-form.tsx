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

  return (
    <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5" onSubmit={submit}>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Title
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          maxLength={120}
          minLength={3}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
          required
          value={values.title}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Summary
        <textarea
          className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
          maxLength={500}
          onChange={(event) => setValues({ ...values, summary: event.target.value })}
          value={values.summary}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Visibility
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Difficulty
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            max={10}
            min={1}
            onChange={(event) =>
              setValues({ ...values, estimatedDifficulty: event.target.value })
            }
            type="number"
            value={values.estimatedDifficulty}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Estimated hours
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Status
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          checked={values.isSpoilerHeavy}
          onChange={(event) =>
            setValues({ ...values, isSpoilerHeavy: event.target.checked })
          }
          type="checkbox"
        />
        Spoiler heavy
      </label>

      <button
        className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
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
