'use client';

import type { CommentResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/panel-state';
import { formatDateTime } from '@/lib/format';

export function CommentsList({
  comments,
}: Readonly<{
  comments: CommentResponseDto[];
}>): ReactNode {
  if (comments.length === 0) {
    return <EmptyState message="No comments yet." />;
  }

  return (
    <div className="divide-y divide-slate-200">
      {comments.map((comment) => (
        <article className="p-4" key={comment.id}>
          <div className="flex flex-wrap items-center gap-2">
            {comment.author.avatarUrl ? (
              <img
                alt=""
                className="h-7 w-7 rounded-full border border-slate-200"
                src={comment.author.avatarUrl}
              />
            ) : null}
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {formatAuthor(comment.author)}
              </p>
              <p className="text-xs text-slate-500">
                {formatDateTime(comment.createdAt)}
              </p>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {comment.body}
          </p>
        </article>
      ))}
    </div>
  );
}

function formatAuthor(author: CommentResponseDto['author']): ReactNode {
  const label = author.displayName ?? author.steamId ?? 'Steam user';

  if (author.publicSlug) {
    return (
      <Link className="text-blue-700 hover:underline" href={`/u/${author.publicSlug}`}>
        {label}
      </Link>
    );
  }

  if (author.steamId) {
    return (
      <Link
        className="text-blue-700 hover:underline"
        href={`/profiles/${author.steamId}`}
      >
        {label}
      </Link>
    );
  }

  return label;
}
