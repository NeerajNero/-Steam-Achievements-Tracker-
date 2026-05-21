import type { ReactNode } from 'react';

export function PageHero({
  actions,
  eyebrow,
  children,
  title,
}: Readonly<{
  actions?: ReactNode;
  eyebrow?: string;
  children?: ReactNode;
  title: string;
}>): ReactNode {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] px-6 py-7 shadow-2xl shadow-black/30 md:px-8 md:py-9">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-4xl">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-lime-300/90">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {title}
          </h1>
          {children ? (
            <div className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              {children}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
