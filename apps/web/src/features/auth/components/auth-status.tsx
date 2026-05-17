'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import type { ReactNode } from 'react';

import { apiBaseUrl } from '@/lib/api/client';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useLogout } from '@/features/auth/api/use-logout';

export function buildSignInUrl(returnTo: string): string {
  const loginEndpoint = `${apiBaseUrl}/auth/steam/login`;

  if (returnTo === '/') {
    return loginEndpoint;
  }

  return `${loginEndpoint}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function AuthStatus(): ReactNode {
  const { data, error, isLoading, isError } = useCurrentUser();
  const logout = useLogout();

  const handleSignIn = useCallback(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.assign(buildSignInUrl(returnTo || '/'));
  }, []);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Checking sign-in status...</p>;
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : 'Unable to check sign-in status.';

    return <p className="text-sm text-amber-700">Auth error: {message}</p>;
  }

  if (!data) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <span className="text-sm text-slate-700">
          You are currently browsing as a guest.
        </span>
        <button
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={handleSignIn}
          type="button"
        >
          Sign in with Steam
        </button>
      </div>
    );
  }

  const label = data.user.displayName ?? 'Steam user';
  const steamId = data.steamAccount?.steamId ?? 'Not linked';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-3">
      {data.user.avatarUrl ? (
        <img
          alt=""
          className="h-8 w-8 rounded-full border border-emerald-200"
          src={data.user.avatarUrl}
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-emerald-900">
          Signed in as {label}
        </p>
        <p className="text-xs text-emerald-700">Steam ID: {steamId}</p>
      </div>
      <Link
        className="rounded-md border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
        href="/settings"
      >
        Settings
      </Link>
      <button
        className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        disabled={logout.isPending}
        onClick={() => void logout.mutateAsync()}
        type="button"
      >
        {logout.isPending ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  );
}
