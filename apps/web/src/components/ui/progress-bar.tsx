import type { ReactNode } from 'react';

export function ProgressBar({
  label,
  value,
}: Readonly<{
  label?: string;
  value: number;
}>): ReactNode {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <div className="grid gap-1">
      {label ? <span className="text-xs text-slate-400">{label}</span> : null}
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-lime-400 shadow-[0_0_16px_rgba(163,230,53,0.45)]"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}

