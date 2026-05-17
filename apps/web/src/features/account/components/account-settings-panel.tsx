'use client';

import { ResponseError } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { useAccountMe } from '@/features/account/api/use-account-me';
import { useUpdateAccount } from '@/features/account/api/use-update-account';
import { useUpdateAccountPreferences } from '@/features/account/api/use-update-account-preferences';
import { useUpdatePublicProfileSettings } from '@/features/account/api/use-update-public-profile-settings';
import { AuthStatus } from '@/features/auth/components/auth-status';

import {
  asAccountPreferenceSettings,
  asPublicProfileSettings,
  normalizeSlug,
  validatePublicSlug,
} from '../utils/settings';

export function AccountSettingsPanel(): ReactNode {
  const account = useAccountMe();
  const updateAccount = useUpdateAccount();
  const updatePreferences = useUpdateAccountPreferences();
  const updatePublicProfile = useUpdatePublicProfileSettings();
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);
  const [publicProfileMessage, setPublicProfileMessage] = useState<string | null>(null);

  if (account.isLoading) {
    return <LoadingState message="Loading account settings..." />;
  }

  if (account.isError) {
    return (
      <ErrorState
        message={getErrorMessage(account.error)}
        title="Unable to load account settings"
      />
    );
  }

  if (!account.data) {
    return (
      <div className="space-y-4">
        <AuthStatus />
        <EmptyState
          message="Sign in with Steam to manage your account and public profile settings."
          title="Account settings require sign-in"
        />
      </div>
    );
  }

  const preferences = asAccountPreferenceSettings(account.data.preferences.settings);
  const publicProfile = account.data.publicProfile;
  const publicSettings = asPublicProfileSettings(publicProfile?.settings ?? {});

  async function handleAccountSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setAccountMessage(null);
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get('displayName') ?? '').trim();
    const avatarUrl = String(form.get('avatarUrl') ?? '').trim();

    await updateAccount
      .mutateAsync({
        displayName,
        avatarUrl: avatarUrl.length === 0 ? null : avatarUrl,
      })
      .then(() => setAccountMessage('Account profile updated.'))
      .catch((error: unknown) => setAccountMessage(getErrorMessage(error)));
  }

  async function handlePreferencesSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setPreferencesMessage(null);
    const form = new FormData(event.currentTarget);

    await updatePreferences
      .mutateAsync({
        settings: {
          defaultGameSort: String(form.get('defaultGameSort')),
          defaultGameOrder: String(form.get('defaultGameOrder')),
          showPrivateHints: form.get('showPrivateHints') === 'on',
        },
      })
      .then(() => setPreferencesMessage('Preferences updated.'))
      .catch((error: unknown) => setPreferencesMessage(getErrorMessage(error)));
  }

  async function handlePublicProfileSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setPublicProfileMessage(null);
    const form = new FormData(event.currentTarget);
    const rawSlug = String(form.get('slug') ?? '');
    const slugError = validatePublicSlug(rawSlug);

    if (slugError !== null) {
      setPublicProfileMessage(slugError);
      return;
    }

    await updatePublicProfile
      .mutateAsync({
        slug: rawSlug.trim().length === 0 ? null : normalizeSlug(rawSlug),
        isPublic: form.get('isPublic') === 'on',
        settings: {
          showRarestAchievements: form.get('showRarestAchievements') === 'on',
          showRecentSyncs: form.get('showRecentSyncs') === 'on',
          showSteamId: form.get('showSteamId') === 'on',
        },
      })
      .then(() => setPublicProfileMessage('Public profile settings updated.'))
      .catch((error: unknown) => setPublicProfileMessage(getErrorMessage(error)));
  }

  return (
    <div className="space-y-6">
      <AuthStatus />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Account Profile</h2>
        <form className="mt-4 grid gap-4" onSubmit={(event) => void handleAccountSubmit(event)}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Display name</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              defaultValue={account.data.user.displayName ?? ''}
              maxLength={80}
              minLength={1}
              name="displayName"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Avatar URL</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              defaultValue={account.data.user.avatarUrl ?? ''}
              name="avatarUrl"
              type="url"
            />
          </label>
          <button
            className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={updateAccount.isPending}
            type="submit"
          >
            {updateAccount.isPending ? 'Saving...' : 'Save account'}
          </button>
          {accountMessage ? <p className="text-sm text-slate-600">{accountMessage}</p> : null}
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Linked Steam Account</h2>
        {account.data.steamAccount ? (
          <dl className="mt-4 grid gap-2 text-sm text-slate-700">
            <div>
              <dt className="font-medium text-slate-900">Steam ID</dt>
              <dd>{account.data.steamAccount.steamId}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Persona</dt>
              <dd>{account.data.steamAccount.personaName ?? 'Unknown'}</dd>
            </div>
          </dl>
        ) : (
          <EmptyState message="No linked Steam account was found." />
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Preferences</h2>
        <form className="mt-4 grid gap-4" onSubmit={(event) => void handlePreferencesSubmit(event)}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Default game sort</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              defaultValue={preferences.defaultGameSort ?? 'completion'}
              name="defaultGameSort"
            >
              <option value="completion">Completion</option>
              <option value="name">Name</option>
              <option value="playtime">Playtime</option>
              <option value="recently_played">Recently played</option>
              <option value="remaining">Remaining</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Default order</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              defaultValue={preferences.defaultGameOrder ?? 'desc'}
              name="defaultGameOrder"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              defaultChecked={preferences.showPrivateHints ?? true}
              name="showPrivateHints"
              type="checkbox"
            />
            Show private profile hints
          </label>
          <button
            className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={updatePreferences.isPending}
            type="submit"
          >
            {updatePreferences.isPending ? 'Saving...' : 'Save preferences'}
          </button>
          {preferencesMessage ? <p className="text-sm text-slate-600">{preferencesMessage}</p> : null}
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Public Profile</h2>
          {publicProfile?.slug ? (
            <Link
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
              href={`/u/${publicProfile.slug}`}
            >
              Preview public profile
            </Link>
          ) : null}
        </div>
        <form className="mt-4 grid gap-4" onSubmit={(event) => void handlePublicProfileSubmit(event)}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Public slug</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              defaultValue={publicProfile?.slug ?? ''}
              name="slug"
              placeholder="my-steam-profile"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input defaultChecked={publicProfile?.isPublic ?? true} name="isPublic" type="checkbox" />
            Publish this profile
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              defaultChecked={publicSettings.showRarestAchievements ?? true}
              name="showRarestAchievements"
              type="checkbox"
            />
            Show rarest achievements
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              defaultChecked={publicSettings.showRecentSyncs ?? true}
              name="showRecentSyncs"
              type="checkbox"
            />
            Show recent syncs
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              defaultChecked={publicSettings.showSteamId ?? true}
              name="showSteamId"
              type="checkbox"
            />
            Show Steam ID publicly
          </label>
          <button
            className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={updatePublicProfile.isPending}
            type="submit"
          >
            {updatePublicProfile.isPending ? 'Saving...' : 'Save public profile'}
          </button>
          {publicProfileMessage ? (
            <p className="text-sm text-slate-600">{publicProfileMessage}</p>
          ) : null}
        </form>
      </section>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ResponseError) {
    if (error.response.status === 409) {
      return 'That public profile slug is already in use.';
    }

    return `Request failed with HTTP ${error.response.status}.`;
  }

  return error instanceof Error ? error.message : 'Request failed.';
}
