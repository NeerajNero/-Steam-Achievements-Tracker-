import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../db/database.module';
import { AuthModule } from '../auth/auth.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
