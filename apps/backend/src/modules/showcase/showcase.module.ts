import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../db/database.module';
import { AuthModule } from '../auth/auth.module';
import { ShowcaseController } from './showcase.controller';
import { ShowcaseService } from './showcase.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ShowcaseController],
  providers: [ShowcaseService],
})
export class ShowcaseModule {}
