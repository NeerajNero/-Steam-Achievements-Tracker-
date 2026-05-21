import type { ReactNode } from 'react';

export function SectionCard({
  actions,
  children,
  contentClassName,
  description,
  title,
}: Readonly<{
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  description?: string;
  title?: string;
}>): ReactNode {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/75 shadow-xl shadow-black/20 backdrop-blur">
      {title || description || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4">
          <div className="max-w-3xl">
            {title ? (
              <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName ?? 'p-5'}>{children}</div>
    </section>
  );
}
