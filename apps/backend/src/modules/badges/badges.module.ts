import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../db/database.module';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BadgesController],
  providers: [BadgesService],
})
export class BadgesModule {}
