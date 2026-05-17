import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../db/database.module';
import { AuthModule } from '../auth/auth.module';
import { GuidesController } from './guides.controller';
import { GuidesService } from './guides.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [GuidesController],
  providers: [GuidesService],
})
export class GuidesModule {}
