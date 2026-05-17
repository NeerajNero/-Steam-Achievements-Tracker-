import type { ReactNode } from 'react';

export function SessionStatusBadge({
  status,
}: Readonly<{
  status: string;
}>): ReactNode {
  const className =
    status === 'open'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'full'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : status === 'completed'
          ? 'border-blue-200 bg-blue-50 text-blue-800'
          : 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${className}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
