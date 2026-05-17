import { Injectable } from '@nestjs/common';

import {
  ActivityEventsRepository,
  type ActivityEntityType,
  type ActivityEvent,
  type ActivityEventInput,
  type ActivityEventType,
  type ActivityEventWithPublicData,
  type ActivityListFilters,
  type ActivityVisibility,
} from '../repositories/activity-events.repository';

export type {
  ActivityEntityType,
  ActivityEvent,
  ActivityEventInput,
  ActivityEventType,
  ActivityEventWithPublicData,
  ActivityListFilters,
  ActivityVisibility,
} from '../repositories/activity-events.repository';

@Injectable()
export class ActivityEventsDataService {
  constructor(private readonly activityEventsRepository: ActivityEventsRepository) {}

  async create(input: ActivityEventInput): Promise<ActivityEvent> {
    return this.activityEventsRepository.create(input);
  }

  async findPublic(
    filters: ActivityListFilters,
  ): Promise<ActivityEventWithPublicData[]> {
    return this.activityEventsRepository.findPublic(filters);
  }

  async countPublic(
    filters: Omit<ActivityListFilters, 'limit' | 'offset'>,
  ): Promise<number> {
    return this.activityEventsRepository.countPublic(filters);
  }
}
