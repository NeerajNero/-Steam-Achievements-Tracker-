import type { ReactNode } from 'react';

export type StatusTone =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent';

const toneClassName: Record<StatusTone, string> = {
  default: 'border-white/10 bg-white/10 text-slate-200',
  success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  warning: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  danger: 'border-red-300/25 bg-red-400/10 text-red-100',
  info: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
  accent: 'border-lime-300/30 bg-lime-400/10 text-lime-100',
};

export function StatusBadge({
  children,
  tone = 'default',
}: Readonly<{
  children: ReactNode;
  tone?: StatusTone;
}>): ReactNode {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClassName[tone]}`}
    >
      {children}
    </span>
  );
}
