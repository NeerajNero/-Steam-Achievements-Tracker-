import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../db/database.module';
import { TargetCompletionService } from './target-completion.service';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [TargetsController],
  providers: [TargetsService, TargetCompletionService],
  exports: [TargetCompletionService],
})
export class TargetsModule {}
