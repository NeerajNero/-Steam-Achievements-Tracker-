import type { ReactNode } from 'react';

export function PageShell({
  children,
  maxWidth = 'max-w-7xl',
}: Readonly<{
  children: ReactNode;
  maxWidth?: string;
}>): ReactNode {
  return (
    <main className={`mx-auto flex w-full flex-col gap-6 ${maxWidth} px-4 py-8 md:px-6`}>
      {children}
    </main>
  );
}
