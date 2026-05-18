import { AccountTargetResponseDtoPriorityEnum } from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import { getPriorityLabel } from './target-labels';

describe('target labels', () => {
  it('labels target priorities', () => {
    expect(getPriorityLabel(AccountTargetResponseDtoPriorityEnum.High)).toBe(
      'High priority',
    );
    expect(getPriorityLabel(AccountTargetResponseDtoPriorityEnum.Medium)).toBe(
      'Medium priority',
    );
    expect(getPriorityLabel(AccountTargetResponseDtoPriorityEnum.Low)).toBe(
      'Low priority',
    );
  });
});
