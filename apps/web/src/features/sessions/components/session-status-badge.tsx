import type { ReactNode } from 'react';

import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';

export function SessionStatusBadge({
  status,
}: Readonly<{
  status: string;
}>): ReactNode {
  const tone: StatusTone =
    status === 'open'
      ? 'success'
      : status === 'full'
        ? 'warning'
        : status === 'completed'
          ? 'info'
          : 'default';

  return <StatusBadge tone={tone}>{status.replace('_', ' ')}</StatusBadge>;
}
