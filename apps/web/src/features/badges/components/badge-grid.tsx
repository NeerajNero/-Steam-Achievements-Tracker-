import type { ProfileBadgeResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { getErrorMessage } from '@/lib/format';

import { ProfileBadgeCard } from './badge-card';

export function BadgeGrid({
  badges,
  error,
  isError,
  isLoading,
  title = 'Badges',
}: Readonly<{
  badges?: ProfileBadgeResponseDto[];
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
  title?: string;
}>): ReactNode {
  return (
    <SectionCard title={title}>
      {isLoading ? <LoadingState message="Loading badges..." /> : null}
      {isError ? (
        <ErrorState message={getErrorMessage(error)} title="Badges unavailable" />
      ) : null}
      {!isLoading && !isError && (badges?.length ?? 0) === 0 ? (
        <EmptyState message="No badges have been earned yet." />
      ) : null}
      {(badges?.length ?? 0) > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {badges?.map((profileBadge) => (
            <ProfileBadgeCard
              key={profileBadge.id}
              profileBadge={profileBadge}
            />
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
