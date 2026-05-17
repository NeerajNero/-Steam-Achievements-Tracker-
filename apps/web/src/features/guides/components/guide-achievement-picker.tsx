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
    <form className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20" onSubmit={submit}>
      <h2 className="font-semibold text-white">Attach achievements</h2>
      <p className="text-sm text-slate-400">
        Paste achievement UUIDs from this game. A richer picker is deferred.
      </p>
      <textarea
        className="min-h-24 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-lime-400"
        onChange={(event) => setIds(event.target.value)}
        placeholder="achievement-uuid, achievement-uuid"
        value={ids}
      />
      <button
        className="w-fit rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Attaching...' : 'Attach achievements'}
      </button>
    </form>
  );
}
