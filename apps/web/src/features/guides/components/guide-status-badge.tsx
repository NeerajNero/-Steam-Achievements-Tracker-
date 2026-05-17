import type { ReactNode } from 'react';

export function GuideStatusBadge({
  status,
}: Readonly<{
  status: string;
}>): ReactNode {
  const styles =
    status === 'published'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'archived'
        ? 'border-slate-200 bg-slate-100 text-slate-700'
        : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${styles}`}>
      {status}
    </span>
  );
}
