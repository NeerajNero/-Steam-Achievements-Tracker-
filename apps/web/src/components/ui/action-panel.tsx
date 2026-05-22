import type { ReactNode } from 'react';

export function ActionPanel({
  actions,
  children,
  eyebrow,
  title,
}: Readonly<{
  actions?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  title: string;
}>): ReactNode {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-xl shadow-black/20">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-300/85">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-slate-300">{children}</div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}
