import type { ReactNode } from 'react';

export function LoadingState({
  message,
}: Readonly<{
  message: string;
}>): ReactNode {
  return <div className="p-5 text-sm text-slate-400">{message}</div>;
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
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-300">
      {title ? <h3 className="font-semibold text-white">{title}</h3> : null}
      <p className={title ? 'mt-1' : undefined}>{message}</p>
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
    <section className="rounded-2xl border border-red-300/25 bg-red-500/10 p-5 text-red-100">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-red-100/85">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
