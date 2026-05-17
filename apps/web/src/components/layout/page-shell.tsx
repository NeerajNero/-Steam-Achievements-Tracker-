import type { ReactNode } from 'react';

export function PageShell({
  children,
  maxWidth = 'max-w-7xl',
}: Readonly<{
  children: ReactNode;
  maxWidth?: string;
}>): ReactNode {
  return <main className={`mx-auto w-full ${maxWidth} px-4 py-6 md:px-6`}>{children}</main>;
}

