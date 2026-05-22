import type { ReactNode } from 'react';

export function DataToolbar({
  children,
  description,
  results,
  title,
}: Readonly<{
  children: ReactNode;
  description?: string;
  results?: ReactNode;
  title?: string;
}>): ReactNode {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/75 p-4 shadow-xl shadow-black/20">
      {title || description || results ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="max-w-3xl">
            {title ? (
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
            ) : null}
          </div>
          {results ? (
            <div className="rounded-full border border-lime-300/20 bg-lime-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-lime-100">
              {results}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </section>
  );
}
