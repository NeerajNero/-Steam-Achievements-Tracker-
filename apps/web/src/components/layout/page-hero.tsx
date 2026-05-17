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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.24),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/30 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">
            {title}
          </h1>
          {children ? (
            <div className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
              {children}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

