import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { getSyncQueueName } from '../queue/queue.config';
import { QueueModule } from '../queue/queue.module';
import { OperationsController } from './operations.controller';

@Module({
  imports: [
    QueueModule,
    BullModule.registerQueue({
      name: getSyncQueueName(),
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
      boardOptions: {
        uiConfig: {
          boardTitle: 'Steam Achievement Queues',
        },
      },
    }),
    BullBoardModule.forFeature({
      name: getSyncQueueName(),
      adapter: BullMQAdapter,
      options: {
        displayName: 'Steam Sync Queue',
        description: 'Profile, games, and achievement sync jobs',
      },
    }),
  ],
  controllers: [OperationsController],
})
export class OperationsModule {}
