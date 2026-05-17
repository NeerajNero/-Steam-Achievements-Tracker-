'use client';

import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import type { CreateGuideSectionDto } from '@steam-achievement/client-sdk';

export function GuideSectionForm({
  isSubmitting,
  onSubmit,
}: Readonly<{
  isSubmitting: boolean;
  onSubmit: (values: CreateGuideSectionDto) => void;
}>): ReactNode {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [position, setPosition] = useState('0');

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit({
      title,
      content,
      position: Number(position),
    });
    setTitle('');
    setContent('');
    setPosition('0');
  }

  const labelClassName = 'grid gap-1 text-sm font-medium text-slate-300';
  const inputClassName =
    'rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-lime-400';

  return (
    <form className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20" onSubmit={submit}>
      <h2 className="font-semibold text-white">Add section</h2>
      <label className={labelClassName}>
        Section title
        <input
          className={inputClassName}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
      </label>
      <label className={labelClassName}>
        Content
        <textarea
          className={`${inputClassName} min-h-36`}
          maxLength={20000}
          onChange={(event) => setContent(event.target.value)}
          required
          value={content}
        />
      </label>
      <label className="grid max-w-40 gap-1 text-sm font-medium text-slate-300">
        Position
        <input
          className={inputClassName}
          min={0}
          onChange={(event) => setPosition(event.target.value)}
          type="number"
          value={position}
        />
      </label>
      <button
        className="w-fit rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Adding...' : 'Add section'}
      </button>
    </form>
  );
}
