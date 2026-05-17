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

  return (
    <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4" onSubmit={submit}>
      <h2 className="font-semibold text-slate-950">Add section</h2>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Section title
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Content
        <textarea
          className="min-h-36 rounded-md border border-slate-300 px-3 py-2 text-sm"
          maxLength={20000}
          onChange={(event) => setContent(event.target.value)}
          required
          value={content}
        />
      </label>
      <label className="grid max-w-40 gap-1 text-sm font-medium text-slate-700">
        Position
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          min={0}
          onChange={(event) => setPosition(event.target.value)}
          type="number"
          value={position}
        />
      </label>
      <button
        className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Adding...' : 'Add section'}
      </button>
    </form>
  );
}
