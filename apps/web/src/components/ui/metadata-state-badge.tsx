import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/ui/status-badge';
import {
  type AchievementMetadataState,
  getAchievementMetadataStateLabel,
  getAchievementMetadataStateTone,
} from '@/utils/metadata-state';

export function MetadataStateBadge({
  state,
}: Readonly<{
  state: AchievementMetadataState;
}>): ReactNode {
  return (
    <StatusBadge tone={getAchievementMetadataStateTone(state)}>
      {getAchievementMetadataStateLabel(state)}
    </StatusBadge>
  );
}
