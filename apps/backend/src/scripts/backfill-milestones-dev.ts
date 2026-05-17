import 'reflect-metadata';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { DatabaseModule } from '../db/database.module';
import { DatabaseService } from '../db/database.service';
import { ActivityEventsRepository } from '../db/repositories/activity-events.repository';
import { ProfileMilestonesRepository } from '../db/repositories/profile-milestones.repository';
import { ProfileSnapshotsRepository } from '../db/repositories/profile-snapshots.repository';
import { ActivityEventsDataService } from '../db/services/activity-events-data.service';
import { ProfileMilestoneBackfillDataService } from '../db/services/profile-milestone-backfill-data.service';
import { ProfileMilestonesDataService } from '../db/services/profile-milestones-data.service';
import { ProfileSnapshotsDataService } from '../db/services/profile-snapshots-data.service';
import { SteamProfilesDataService } from '../db/services/steam-profiles-data.service';

@Module({
  imports: [DatabaseModule],
})
class MilestoneBackfillDevModule {}

async function main(): Promise<void> {
  assertLocalDevOnly();

  const steamId = getSteamIdArg();
  const app = await NestFactory.createApplicationContext(
    MilestoneBackfillDevModule,
    {
      abortOnError: false,
      logger: ['error'],
    },
  );

  try {
    const databaseService = app.get(DatabaseService);
    const steamProfilesDataService = app.get(SteamProfilesDataService);
    const backfillDataService =
      createMilestoneBackfillDataService(databaseService);

    if (steamId !== null) {
      const profile = await steamProfilesDataService.findBySteamId(steamId);

      if (profile === null) {
        throw new Error(`Steam profile ${steamId} was not found.`);
      }

      const result = await backfillDataService.backfillMilestonesForProfile(
        profile.id,
      );

      console.log('milestone backfill: passed');
      console.log('profilesProcessed: 1');
      console.log(`milestonesCreated: ${result.milestonesCreated}`);
      console.log(`activityEventsCreated: ${result.activityEventsCreated}`);
      return;
    }

    const summary = await backfillDataService.backfillAllProfilesWithSnapshots();

    console.log('milestone backfill: passed');
    console.log(`profilesProcessed: ${summary.profilesProcessed}`);
    console.log(`milestonesCreated: ${summary.milestonesCreated}`);
    console.log(`activityEventsCreated: ${summary.activityEventsCreated}`);
  } finally {
    await app.close();
  }
}

function createMilestoneBackfillDataService(
  databaseService: DatabaseService,
): ProfileMilestoneBackfillDataService {
  return new ProfileMilestoneBackfillDataService(
    new ProfileSnapshotsDataService(
      new ProfileSnapshotsRepository(databaseService),
    ),
    new ProfileMilestonesDataService(
      new ProfileMilestonesRepository(databaseService),
    ),
    new ActivityEventsDataService(new ActivityEventsRepository(databaseService)),
  );
}

function assertLocalDevOnly(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('milestones:backfill-dev cannot run in production.');
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
    error instanceof Error ? error.message : 'Unknown milestone backfill error';
  console.error(`Milestone backfill failed: ${message}`);
  process.exitCode = 1;
});

export {};
