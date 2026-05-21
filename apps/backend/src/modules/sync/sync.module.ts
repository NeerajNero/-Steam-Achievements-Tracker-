import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { getSyncQueueName } from '../queue/queue.config';
import { QueueModule } from '../queue/queue.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { SteamModule } from '../steam/steam.module';
import { TargetCompletionService } from '../targets/target-completion.service';
import { SyncController } from './sync.controller';
import { SyncProcessor } from './sync.processor';
import { SyncService } from './sync.service';
import { SyncWorkflowService } from './sync-workflow.service';

@Module({
  imports: [
    ProfilesModule,
    SteamModule,
    QueueModule,
    BullModule.registerQueue({
      name: getSyncQueueName(),
    }),
  ],
  controllers: [SyncController],
  providers: [SyncService, SyncWorkflowService, SyncProcessor, TargetCompletionService],
})
export class SyncModule {}
