import 'reflect-metadata';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { DatabaseModule } from '../db/database.module';
import { DatabaseService } from '../db/database.service';
import { ActivityEventsRepository } from '../db/repositories/activity-events.repository';
import { BadgesRepository } from '../db/repositories/badges.repository';
import { ProfileBadgesRepository } from '../db/repositories/profile-badges.repository';
import { ProfileMilestonesRepository } from '../db/repositories/profile-milestones.repository';
import { ProfileSnapshotsRepository } from '../db/repositories/profile-snapshots.repository';
import { ActivityEventsDataService } from '../db/services/activity-events-data.service';
import { BadgesDataService } from '../db/services/badges-data.service';
import { ProfileBadgeBackfillDataService } from '../db/services/profile-badge-backfill-data.service';
import { ProfileBadgesDataService } from '../db/services/profile-badges-data.service';
import { ProfileMilestonesDataService } from '../db/services/profile-milestones-data.service';
import { ProfileSnapshotsDataService } from '../db/services/profile-snapshots-data.service';
import { SteamProfilesDataService } from '../db/services/steam-profiles-data.service';

@Module({
  imports: [DatabaseModule],
})
class BadgeBackfillDevModule {}

async function main(): Promise<void> {
  assertLocalDevOnly();

  const steamId = getSteamIdArg();
  const app = await NestFactory.createApplicationContext(BadgeBackfillDevModule, {
    abortOnError: false,
    logger: ['error'],
  });

  try {
    const databaseService = app.get(DatabaseService);
    const steamProfilesDataService = app.get(SteamProfilesDataService);
    const backfillDataService = createBadgeBackfillDataService(databaseService);

    if (steamId !== null) {
      const profile = await steamProfilesDataService.findBySteamId(steamId);

      if (profile === null) {
        throw new Error(`Steam profile ${steamId} was not found.`);
      }

      const result = await backfillDataService.backfillBadgesForProfile(profile.id);

      console.log('badge backfill: passed');
      console.log('profilesProcessed: 1');
      console.log(`milestonesProcessed: ${result.milestonesProcessed}`);
      console.log(`badgesAwarded: ${result.badgesAwarded}`);
      console.log(`activityEventsCreated: ${result.activityEventsCreated}`);
      return;
    }

    const summary = await backfillDataService.backfillAllProfilesWithMilestones();

    console.log('badge backfill: passed');
    console.log(`profilesProcessed: ${summary.profilesProcessed}`);
    console.log(`milestonesProcessed: ${summary.milestonesProcessed}`);
    console.log(`badgesAwarded: ${summary.badgesAwarded}`);
    console.log(`activityEventsCreated: ${summary.activityEventsCreated}`);
  } finally {
    await app.close();
  }
}

function createBadgeBackfillDataService(
  databaseService: DatabaseService,
): ProfileBadgeBackfillDataService {
  const activityEventsDataService = new ActivityEventsDataService(
    new ActivityEventsRepository(databaseService),
  );
  const badgesDataService = new BadgesDataService(
    new BadgesRepository(databaseService),
  );
  const profileBadgesDataService = new ProfileBadgesDataService(
    new ProfileBadgesRepository(databaseService),
    badgesDataService,
    activityEventsDataService,
  );

  return new ProfileBadgeBackfillDataService(
    new ProfileSnapshotsDataService(
      new ProfileSnapshotsRepository(databaseService),
    ),
    new ProfileMilestonesDataService(
      new ProfileMilestonesRepository(databaseService),
    ),
    profileBadgesDataService,
  );
}

function assertLocalDevOnly(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('badges:backfill-dev cannot run in production.');
  }
}

function getSteamIdArg(): string | null {
  const envSteamId = process.env.STEAM_ID?.trim();
  if (envSteamId !== undefined && envSteamId.length > 0) {
    return envSteamId;
  }

  const arg = process.argv.slice(2).find((value) => value.trim().length > 0);

  if (arg === undefined) {
    return null;
  }

  if (arg.startsWith('--steam-id=')) {
    return arg.slice('--steam-id='.length).trim() || null;
  }

  return arg.trim();
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown badge backfill error';
  console.error(`Badge backfill failed: ${message}`);
  process.exitCode = 1;
});

export {};
