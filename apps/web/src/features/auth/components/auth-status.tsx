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

export function AuthStatus({
  compact = false,
}: Readonly<{
  compact?: boolean;
}>): ReactNode {
  const { data, error, isLoading, isError } = useCurrentUser();
  const logout = useLogout();

  const handleSignIn = useCallback(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.assign(buildSignInUrl(returnTo || '/'));
  }, []);

  if (isLoading) {
    return <p className="text-sm text-slate-400">Checking sign-in status...</p>;
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : 'Unable to check sign-in status.';

    return <p className="text-sm text-amber-200">Auth error: {message}</p>;
  }

  if (!data) {
    return (
      <div
        className={`flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 ${
          compact ? 'p-2' : 'p-3'
        }`}
      >
        {!compact ? (
          <span className="text-sm text-slate-300">
          You are currently browsing as a guest.
          </span>
        ) : null}
        <button
          className="rounded-full bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
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
    <div
      className={`flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 ${
        compact ? 'p-2' : 'p-3'
      }`}
    >
      {data.user.avatarUrl ? (
        <img
          alt=""
          className="h-8 w-8 rounded-full border border-emerald-300/30"
          src={data.user.avatarUrl}
        />
      ) : null}
      <div className={`min-w-0 ${compact ? 'hidden sm:block' : ''}`}>
        <p className="text-sm font-semibold text-emerald-100">
          Signed in as {label}
        </p>
        <p className="text-xs text-emerald-200/80">Steam ID: {steamId}</p>
      </div>
      <Link
        className="rounded-full border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/10"
        href="/settings"
      >
        Settings
      </Link>
      <button
        className="rounded-full bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
        disabled={logout.isPending}
        onClick={() => void logout.mutateAsync()}
        type="button"
      >
        {logout.isPending ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  );
}
