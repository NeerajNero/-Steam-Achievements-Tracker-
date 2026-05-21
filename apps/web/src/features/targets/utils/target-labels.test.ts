import {
  AccountTargetResponseDtoPriorityEnum,
  AccountTargetResponseDtoStatusEnum,
} from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import { getPriorityLabel, getStatusTone } from './target-labels';

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

  it('maps target statuses to badge tones', () => {
    expect(getStatusTone(AccountTargetResponseDtoStatusEnum.Active)).toBe('info');
    expect(getStatusTone(AccountTargetResponseDtoStatusEnum.Completed)).toBe(
      'success',
    );
    expect(getStatusTone(AccountTargetResponseDtoStatusEnum.Paused)).toBe(
      'warning',
    );
    expect(getStatusTone(AccountTargetResponseDtoStatusEnum.Ignored)).toBe(
      'danger',
    );
    expect(getStatusTone(AccountTargetResponseDtoStatusEnum.Archived)).toBe(
      'default',
    );
  });
});
