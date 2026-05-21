import type { ReactNode } from 'react';

export function ResponsiveTwoColumn({
  aside,
  children,
  layout = 'balanced',
}: Readonly<{
  aside: ReactNode;
  children: ReactNode;
  layout?: 'balanced' | 'content-heavy';
}>): ReactNode {
  const className =
    layout === 'content-heavy'
      ? 'grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]'
      : 'grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]';

  return (
    <section className={className}>
      <div className="space-y-6">{children}</div>
      <aside className="space-y-6">{aside}</aside>
    </section>
  );
}
