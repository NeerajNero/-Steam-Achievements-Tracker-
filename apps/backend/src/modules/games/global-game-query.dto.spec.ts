import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { GlobalGameAchievementsQueryDto } from './dto/global-game-achievements-query.dto';
import { GlobalGamePlayersQueryDto } from './dto/global-game-players-query.dto';
import { GlobalGameQueryDto } from './dto/global-game-query.dto';

describe('global game query DTOs', () => {
  it('uses safe defaults for empty game list queries', () => {
    const query = plainToInstance(GlobalGameQueryDto, {});

    expect(validateSync(query)).toHaveLength(0);
    expect(query.limit).toBe(25);
    expect(query.offset).toBe(0);
    expect(query.sort).toBe('tracked_players');
    expect(query.order).toBe('desc');
  });

  it('parses hasAchievements booleans without treating false as true', () => {
    const query = plainToInstance(GlobalGameQueryDto, {
      hasAchievements: 'false',
    });

    expect(validateSync(query)).toHaveLength(0);
    expect(query.hasAchievements).toBe(false);
  });

  it('rejects invalid game list query values', () => {
    const query = plainToInstance(GlobalGameQueryDto, {
      hasAchievements: 'maybe',
      sort: 'platform',
      order: 'sideways',
      limit: '500',
      offset: '-1',
    });

    const properties = validateSync(query).map((error) => error.property);

    expect(properties).toEqual(
      expect.arrayContaining([
        'hasAchievements',
        'sort',
        'order',
        'limit',
        'offset',
      ]),
    );
  });

  it('rejects invalid achievement and player filters', () => {
    const achievementQuery = plainToInstance(GlobalGameAchievementsQueryDto, {
      hidden: 'secret',
      sort: 'unlocked_at',
      limit: '1000',
    });
    const playerQuery = plainToInstance(GlobalGamePlayersQueryDto, {
      status: 'no_achievements',
      sort: 'name',
      limit: '0',
    });

    expect(validateSync(achievementQuery).map((error) => error.property)).toEqual(
      expect.arrayContaining(['hidden', 'sort', 'limit']),
    );
    expect(validateSync(playerQuery).map((error) => error.property)).toEqual(
      expect.arrayContaining(['status', 'sort', 'limit']),
    );
  });
});
