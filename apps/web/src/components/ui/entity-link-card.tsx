import Link from 'next/link';
import type { ReactNode } from 'react';

export function EntityLinkCard({
  description,
  eyebrow,
  href,
  title,
}: Readonly<{
  description: string;
  eyebrow?: string;
  href: string;
  title: string;
}>): ReactNode {
  return (
    <Link
      className="group rounded-[24px] border border-white/10 bg-slate-950/75 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-lime-300/30 hover:bg-slate-900"
      href={href}
    >
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-300/80">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-lg font-semibold tracking-tight text-white group-hover:text-lime-100">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </Link>
  );
}
