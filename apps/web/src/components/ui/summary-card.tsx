import type { ReactNode } from 'react';

export function SummaryCard({
  label,
  loading = false,
  value,
}: Readonly<{
  label: string;
  loading?: boolean;
  value: string;
}>): ReactNode {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">
        {loading ? '...' : value}
      </div>
    </article>
  );
}
