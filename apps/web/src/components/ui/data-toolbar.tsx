import type { ReactNode } from 'react';

export function DataToolbar({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/75 p-4 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </section>
  );
}
