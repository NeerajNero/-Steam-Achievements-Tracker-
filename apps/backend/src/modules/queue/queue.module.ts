import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';

import { getBullMqConnectionConfig } from './queue.config';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: getBullMqConnectionConfig(),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
