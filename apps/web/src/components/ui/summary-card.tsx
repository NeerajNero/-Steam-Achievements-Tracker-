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
  value: ReactNode;
}>): ReactNode {
  return (
    <article className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-xl shadow-black/20">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {loading ? '...' : value}
      </div>
      {hint ? <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </article>
  );
}
