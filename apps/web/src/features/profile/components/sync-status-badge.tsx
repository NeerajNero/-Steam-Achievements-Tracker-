import type { ReactNode } from 'react';

import {
  getSyncStatusBadgeClassName,
  getSyncStatusLabel,
} from '../utils/sync-status';

export function SyncStatusBadge({
  status,
}: Readonly<{
  status: string;
}>): ReactNode {
  return (
    <span className={getSyncStatusBadgeClassName(status)}>
      {getSyncStatusLabel(status)}
    </span>
  );
}
