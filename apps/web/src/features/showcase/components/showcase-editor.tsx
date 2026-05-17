'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { useProfileBadges } from '@/features/badges/api/use-profile-badges';
import { BadgeTierBadge } from '@/features/badges/components/badge-tier-badge';
import { getErrorMessage } from '@/lib/format';

import { useAccountShowcase } from '../api/use-account-showcase';
import { useUpdateAccountShowcase } from '../api/use-update-account-showcase';
import { buildBadgeShowcaseItems } from '../utils/showcase-validation';

export function ShowcaseEditor({
  steamId,
}: Readonly<{
  steamId: string;
}>): ReactNode {
  const accountShowcase = useAccountShowcase(steamId.length > 0);
  const profileBadges = useProfileBadges(steamId);
  const updateShowcase = useUpdateAccountShowcase();
  const [message, setMessage] = useState<string | null>(null);
  const selectedBadgeIds = useMemo(
    () =>
      accountShowcase.data?.items
        .filter((item) => item.itemType === 'badge')
        .map((item) => item.itemId) ?? [],
    [accountShowcase.data?.items],
  );
  const [checkedBadgeIds, setCheckedBadgeIds] = useState<string[] | null>(null);
  const checked = checkedBadgeIds ?? selectedBadgeIds;

  if (accountShowcase.isLoading || profileBadges.isLoading) {
    return <LoadingState message="Loading showcase editor..." />;
  }

  if (accountShowcase.isError || profileBadges.isError) {
    return (
      <ErrorState
        message={getErrorMessage(accountShowcase.error ?? profileBadges.error)}
        title="Unable to load showcase editor"
      />
    );
  }

  const earnedBadges = profileBadges.data?.items ?? [];

  async function save(): Promise<void> {
    setMessage(null);

    try {
      await updateShowcase.mutateAsync({
        items: buildBadgeShowcaseItems(checked, earnedBadges),
      });
      setMessage('Showcase updated.');
      setCheckedBadgeIds(null);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <SectionCard title="Profile Showcase">
      {earnedBadges.length === 0 ? (
        <EmptyState message="Earn badges from milestones before choosing showcase items." />
      ) : (
        <div className="mt-4 grid gap-3">
          {earnedBadges.map((profileBadge) => (
            <label
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              key={profileBadge.id}
            >
              <input
                checked={checked.includes(profileBadge.id)}
                className="mt-1"
                onChange={(event) => {
                  setCheckedBadgeIds((current) => {
                    const base = current ?? selectedBadgeIds;
                    return event.target.checked
                      ? [...base, profileBadge.id]
                      : base.filter((id) => id !== profileBadge.id);
                  });
                }}
                type="checkbox"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {profileBadge.badge.name}
                  </span>
                  <BadgeTierBadge tier={profileBadge.badge.tier} />
                </span>
                {profileBadge.badge.description ? (
                  <span className="mt-1 block text-sm text-slate-400">
                    {profileBadge.badge.description}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      )}
      <button
        className="mt-4 w-fit rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-60"
        disabled={updateShowcase.isPending || earnedBadges.length === 0}
        onClick={() => void save()}
        type="button"
      >
        {updateShowcase.isPending ? 'Saving...' : 'Save showcase'}
      </button>
      {message ? <p className="mt-3 text-sm text-slate-400">{message}</p> : null}
    </SectionCard>
  );
}
