import type { ShowcaseItemResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { getErrorMessage } from '@/lib/format';

import { ShowcaseItemCard } from './showcase-item-card';

export function ProfileShowcase({
  error,
  isError,
  isLoading,
  items,
  title = 'Profile Showcase',
}: Readonly<{
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
  items?: ShowcaseItemResponseDto[];
  title?: string;
}>): ReactNode {
  return (
    <SectionCard title={title}>
      {isLoading ? <LoadingState message="Loading showcase..." /> : null}
      {isError ? (
        <ErrorState
          message={getErrorMessage(error)}
          title="Showcase unavailable"
        />
      ) : null}
      {!isLoading && !isError && (items?.length ?? 0) === 0 ? (
        <EmptyState message="No showcase items have been selected yet." />
      ) : null}
      {(items?.length ?? 0) > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items?.map((item) => (
            <ShowcaseItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
