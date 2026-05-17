'use client';

import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';

export function GuideAchievementPicker({
  isSubmitting,
  onSubmit,
}: Readonly<{
  isSubmitting: boolean;
  onSubmit: (achievementIds: string[]) => void;
}>): ReactNode {
  const [ids, setIds] = useState('');

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const achievementIds = ids
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (achievementIds.length > 0) {
      onSubmit(achievementIds);
      setIds('');
    }
  }

  return (
    <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4" onSubmit={submit}>
      <h2 className="font-semibold text-slate-950">Attach achievements</h2>
      <p className="text-sm text-slate-600">
        Paste achievement UUIDs from this game. A richer picker is deferred.
      </p>
      <textarea
        className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
        onChange={(event) => setIds(event.target.value)}
        placeholder="achievement-uuid, achievement-uuid"
        value={ids}
      />
      <button
        className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Attaching...' : 'Attach achievements'}
      </button>
    </form>
  );
}
