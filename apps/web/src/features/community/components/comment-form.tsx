'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { getErrorMessage } from '@/lib/format';

export function CommentForm({
  disabled = false,
  onSubmit,
  submitLabel = 'Post comment',
}: Readonly<{
  disabled?: boolean;
  onSubmit: (body: string) => Promise<unknown>;
  submitLabel?: string;
}>): ReactNode {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = body.trim();

    if (normalized.length === 0) {
      setError('Comment cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(normalized);
      setBody('');
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Comment
        <textarea
          className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
          disabled={disabled || isSubmitting}
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a helpful note for other Steam achievement hunters."
          value={body}
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        className="w-fit rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        disabled={disabled || isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Posting...' : submitLabel}
      </button>
    </form>
  );
}
