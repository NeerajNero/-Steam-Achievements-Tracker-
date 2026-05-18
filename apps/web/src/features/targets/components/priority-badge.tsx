import { AccountTargetResponseDtoPriorityEnum } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';

import { getPriorityLabel } from '../utils/target-labels';

const priorityTone: Record<AccountTargetResponseDtoPriorityEnum, StatusTone> = {
  [AccountTargetResponseDtoPriorityEnum.High]: 'danger',
  [AccountTargetResponseDtoPriorityEnum.Medium]: 'accent',
  [AccountTargetResponseDtoPriorityEnum.Low]: 'default',
};

export function PriorityBadge({
  priority,
}: Readonly<{
  priority: AccountTargetResponseDtoPriorityEnum;
}>): ReactNode {
  return (
    <StatusBadge tone={priorityTone[priority]}>
      {getPriorityLabel(priority)}
    </StatusBadge>
  );
}
