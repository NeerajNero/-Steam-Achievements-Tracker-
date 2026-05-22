import type { ReactNode } from 'react';

export function LoadingState({
  eyebrow,
  icon = '...',
  message,
}: Readonly<{
  eyebrow?: string;
  icon?: ReactNode;
  message: string;
}>): ReactNode {
  return (
    <div className="rounded-[22px] border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20">
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-lime-300/20 bg-lime-400/10 text-sm font-semibold text-lime-100">
          <span className="animate-pulse">{icon}</span>
        </div>
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-300/85">
              {eyebrow}
            </p>
          ) : null}
          <p className={`${eyebrow ? 'mt-1' : ''} text-sm leading-6 text-slate-300`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  action,
  eyebrow,
  icon = '?',
  message,
  title,
}: Readonly<{
  action?: ReactNode;
  eyebrow?: string;
  icon?: ReactNode;
  message: string;
  title?: string;
}>): ReactNode {
  return (
    <div className="rounded-[22px] border border-dashed border-white/10 bg-slate-950/60 p-5 text-sm text-slate-300 shadow-xl shadow-black/10">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-lime-300/20 bg-lime-400/10 text-lime-100">
          {icon}
        </div>
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-300/85">
              {eyebrow}
            </p>
          ) : null}
          {title ? <h3 className="font-semibold text-white">{title}</h3> : null}
          <p className={title || eyebrow ? 'mt-1 leading-6' : 'leading-6'}>{message}</p>
        </div>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  action,
  eyebrow,
  icon = '!',
  message,
  title = 'Request failed',
}: Readonly<{
  action?: ReactNode;
  eyebrow?: string;
  icon?: ReactNode;
  message: string;
  title?: string;
}>): ReactNode {
  return (
    <section className="rounded-[22px] border border-red-300/25 bg-red-500/10 p-5 text-red-100 shadow-xl shadow-black/10">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-red-300/30 bg-red-400/10 font-semibold text-red-100">
          {icon}
        </div>
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-100/80">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-red-100/85">{message}</p>
        </div>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
