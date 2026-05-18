import {
  ListAccountTargetsStatusEnum,
  ListAccountTargetsTypeEnum,
} from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import { targetQueryKeys } from './target-query-keys';

describe('targetQueryKeys', () => {
  it('keeps account target list keys stable', () => {
    expect(
      targetQueryKeys.list({
        limit: 100,
        offset: 0,
        status: ListAccountTargetsStatusEnum.Active,
        type: ListAccountTargetsTypeEnum.All,
      }),
    ).toEqual([
      'targets',
      'list',
      {
        limit: 100,
        offset: 0,
        status: 'active',
        type: 'all',
      },
    ]);
  });
});
