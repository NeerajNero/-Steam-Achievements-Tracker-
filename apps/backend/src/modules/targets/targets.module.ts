import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../db/database.module';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [TargetsController],
  providers: [TargetsService],
})
export class TargetsModule {}
