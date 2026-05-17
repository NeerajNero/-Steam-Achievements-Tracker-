import { describe, expect, it } from 'vitest';
import {
  BadgeResponseDtoBadgeTypeEnum,
  BadgeResponseDtoTierEnum,
  type ProfileBadgeResponseDto,
} from '@steam-achievement/client-sdk';

import { buildBadgeShowcaseItems } from './showcase-validation';

describe('buildBadgeShowcaseItems', () => {
  it('builds ordered public badge showcase items', () => {
    expect(
      buildBadgeShowcaseItems(['profile-badge-1'], [
        createProfileBadge('profile-badge-1'),
      ]),
    ).toEqual([
      {
        itemType: 'badge',
        itemId: 'profile-badge-1',
        position: 0,
        visibility: 'public',
        titleOverride: null,
      },
    ]);
  });

  it('rejects unearned badge ids', () => {
    expect(() => buildBadgeShowcaseItems(['missing'], [])).toThrow(
      'Showcase includes a badge this profile has not earned.',
    );
  });

  it('enforces the v1 item limit', () => {
    expect(() =>
      buildBadgeShowcaseItems(
        ['1', '2', '3', '4', '5', '6', '7'],
        ['1', '2', '3', '4', '5', '6', '7'].map(createProfileBadge),
      ),
    ).toThrow('Choose at most 6 showcase items.');
  });
});

function createProfileBadge(id: string): ProfileBadgeResponseDto {
  return {
    id,
    badge: {
      id: `badge-${id}`,
      code: `badge-${id}`,
      name: `Badge ${id}`,
      description: null,
      badgeType: BadgeResponseDtoBadgeTypeEnum.Milestone,
      tier: BadgeResponseDtoTierEnum.Bronze,
      iconKey: 'spark',
      sortOrder: 1,
    },
    sourceMilestoneId: null,
    earnedAt: '2026-05-17T00:00:00.000Z',
    metadata: {},
  };
}
