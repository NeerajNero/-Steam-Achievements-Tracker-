import type { ReactNode } from 'react';

import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';

export function GuideStatusBadge({
  status,
}: Readonly<{
  status: string;
}>): ReactNode {
  const tone: StatusTone =
    status === 'published'
      ? 'success'
      : status === 'archived'
        ? 'default'
        : 'warning';

  return <StatusBadge tone={tone}>{status}</StatusBadge>;
}
