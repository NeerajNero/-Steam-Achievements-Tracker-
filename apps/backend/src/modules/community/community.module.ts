import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../db/database.module';
import { AuthModule } from '../auth/auth.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [CommunityController, ReportsController],
  providers: [CommunityService],
})
export class CommunityModule {}
