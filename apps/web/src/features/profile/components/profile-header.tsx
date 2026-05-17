import type {
  ProfileDetailResponseDto,
  ProfileSummaryResponseDto,
} from '@steam-achievement/client-sdk';

import { formatDateTime } from '@/lib/format';

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
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Loading profile header...</p>
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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Public Profile
          </p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            {title}
          </h1>
          <p className="text-sm text-slate-600">Steam ID: {profile.steamId}</p>
          <p className="text-sm text-slate-600">
            Visibility: <span>{visibility}</span>
            {profile.isPrivate ? ' (not fully public data)' : ''}
          </p>
          <p className="text-sm text-slate-600">
            Last synced: {formatDateTime(profile.lastSyncedAt)}
          </p>
        </div>
        {profile.avatarUrl ? (
          <img
            alt="Steam avatar"
            className="h-16 w-16 rounded-md border border-slate-200"
            src={profile.avatarUrl}
          />
        ) : null}
      </div>
    </section>
  );
}

