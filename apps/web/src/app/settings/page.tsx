import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { AccountSettingsPanel } from '@/features/account/components/account-settings-panel';

export const metadata: Metadata = {
  title: 'Settings | Steam Achievement Tracker',
};

export default function SettingsPage(): ReactNode {
  return (
    <PageShell maxWidth="max-w-5xl">
      <div className="mb-6">
        <PageHero
          actions={
            <Link
              className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              href="/account/guides"
            >
              Manage guides
            </Link>
          }
          eyebrow="Account"
          title="Settings"
        >
          <p>
          Manage your Steam-only account, linked profile, preferences, and public profile.
          </p>
        </PageHero>
      </div>
      <AccountSettingsPanel />
    </PageShell>
  );
}
