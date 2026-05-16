import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { GameLibraryQueryDto } from './dto/game-library-query.dto';

describe('GameLibraryQueryDto', () => {
  it('accepts defaults for an empty query', () => {
    const query = plainToInstance(GameLibraryQueryDto, {});

    expect(validateSync(query)).toHaveLength(0);
    expect(query.limit).toBe(50);
    expect(query.offset).toBe(0);
  });

  it('rejects invalid enum values and unsafe limits', () => {
    const query = plainToInstance(GameLibraryQueryDto, {
      status: 'played',
      sort: 'rarity',
      order: 'sideways',
      limit: '500',
      offset: '-1',
    });

    const properties = validateSync(query).map((error) => error.property);

    expect(properties).toEqual(
      expect.arrayContaining(['status', 'sort', 'order', 'limit', 'offset']),
    );
  });
});
