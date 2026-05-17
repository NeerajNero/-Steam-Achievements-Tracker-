import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../db/database.module';
import { AuthModule } from '../auth/auth.module';
import { GamingSessionsController } from './gaming-sessions.controller';
import { GamingSessionsService } from './gaming-sessions.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [GamingSessionsController],
  providers: [GamingSessionsService],
})
export class GamingSessionsModule {}
