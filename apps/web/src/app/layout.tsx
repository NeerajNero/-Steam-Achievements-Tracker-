import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';

import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Steam Achievement Tracker',
  description: 'Local Steam achievement dashboard powered by the backend SDK.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
