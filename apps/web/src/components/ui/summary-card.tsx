import type { ReactNode } from 'react';

export function SummaryCard({
  label,
  loading = false,
  hint,
  value,
}: Readonly<{
  hint?: string;
  label: string;
  loading?: boolean;
  value: string;
}>): ReactNode {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20">
      <div className="text-sm font-medium text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">
        {loading ? '...' : value}
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}
