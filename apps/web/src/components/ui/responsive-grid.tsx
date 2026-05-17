import type { ReactNode } from 'react';

export function ResponsiveGrid({
  children,
  min = 'minmax(220px,1fr)',
}: Readonly<{
  children: ReactNode;
  min?: string;
}>): ReactNode {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))` }}
    >
      {children}
    </div>
  );
}

