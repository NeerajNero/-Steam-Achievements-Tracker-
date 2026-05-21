import type { ReactNode } from 'react';

export function LoadingState({
  message,
}: Readonly<{
  message: string;
}>): ReactNode {
  return (
    <div className="rounded-[22px] border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-lime-300" />
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  action,
  message,
  title,
}: Readonly<{
  action?: ReactNode;
  message: string;
  title?: string;
}>): ReactNode {
  return (
    <div className="rounded-[22px] border border-dashed border-white/10 bg-slate-950/60 p-5 text-sm text-slate-300 shadow-xl shadow-black/10">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-lime-300/20 bg-lime-400/10 text-lime-100">
          ?
        </div>
        <div className="min-w-0">
          {title ? <h3 className="font-semibold text-white">{title}</h3> : null}
          <p className={title ? 'mt-1 leading-6' : 'leading-6'}>{message}</p>
        </div>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  action,
  message,
  title = 'Request failed',
}: Readonly<{
  action?: ReactNode;
  message: string;
  title?: string;
}>): ReactNode {
  return (
    <section className="rounded-[22px] border border-red-300/25 bg-red-500/10 p-5 text-red-100 shadow-xl shadow-black/10">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-red-300/30 bg-red-400/10 font-semibold text-red-100">
          !
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-red-100/85">{message}</p>
        </div>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
