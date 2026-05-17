import { Injectable } from '@nestjs/common';

import {
  BadgesRepository,
  type Badge,
  type BadgeTier,
  type BadgeType,
} from '../repositories/badges.repository';

export type { Badge, BadgeTier, BadgeType } from '../repositories/badges.repository';

@Injectable()
export class BadgesDataService {
  constructor(private readonly badgesRepository: BadgesRepository) {}

  async findActive(): Promise<Badge[]> {
    return this.badgesRepository.findActive();
  }

  async findActiveByCode(code: string): Promise<Badge | null> {
    return this.badgesRepository.findActiveByCode(code);
  }

  async findActiveByCodes(codes: string[]): Promise<Badge[]> {
    return this.badgesRepository.findActiveByCodes(codes);
  }
}
