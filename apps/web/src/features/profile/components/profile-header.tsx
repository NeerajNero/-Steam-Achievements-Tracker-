import type {
  ProfileDetailResponseDto,
  ProfileSummaryResponseDto,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';

import { formatDateTime } from '@/lib/format';
import { StatusBadge } from '@/components/ui/status-badge';

type ProfileIdentity = Pick<
  ProfileDetailResponseDto,
  'steamId' | 'personaName' | 'avatarUrl' | 'visibilityState' | 'isPrivate' | 'lastSyncedAt'
>;

type ProfileHeaderProfile = ProfileSummaryResponseDto | ProfileIdentity;

export function ProfileHeader({
  profile,
}: Readonly<{
  profile?: ProfileHeaderProfile;
}>): React.ReactNode {
  if (profile === undefined) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-black/20">
        <p className="text-sm text-slate-400">Loading profile header...</p>
      </div>
    );
  }

  const title = profile.personaName?.trim()?.length
    ? profile.personaName
    : 'Unknown profile';
  const visibility = profile.isPrivate
    ? 'Private'
    : profile.visibilityState === 1
      ? 'Private'
      : profile.visibilityState === 3
        ? 'Public'
        : 'Visibility unknown';

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/30 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="accent">Steam profile</StatusBadge>
            <StatusBadge tone={visibility === 'Public' ? 'success' : 'warning'}>
              {visibility}
            </StatusBadge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white md:text-5xl">
            {title}
          </h1>
          <p className="text-sm text-slate-300">Steam ID: {profile.steamId}</p>
          <p className="text-sm text-slate-400">
            {profile.isPrivate ? ' (not fully public data)' : ''}
          </p>
          <p className="text-sm text-slate-400">
            Last synced: {formatDateTime(profile.lastSyncedAt)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              href={`/profiles/${profile.steamId}/games`}
            >
              Open game library
            </Link>
          </div>
        </div>
        {profile.avatarUrl ? (
          <img
            alt="Steam avatar"
            className="h-20 w-20 rounded-2xl border border-white/15 shadow-xl"
            src={profile.avatarUrl}
          />
        ) : null}
      </div>
    </section>
  );
}
