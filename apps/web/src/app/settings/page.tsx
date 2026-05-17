import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AccountSettingsPanel } from '@/features/account/components/account-settings-panel';

export const metadata: Metadata = {
  title: 'Settings | Steam Achievement Tracker',
};

export default function SettingsPage(): ReactNode {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your Steam-only account, linked profile, preferences, and public profile.
        </p>
      </header>
      <AccountSettingsPanel />
    </main>
  );
}
