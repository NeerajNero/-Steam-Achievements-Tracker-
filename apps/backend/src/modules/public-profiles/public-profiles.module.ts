import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../db/database.module';
import { PublicProfilesController } from './public-profiles.controller';
import { PublicProfilesService } from './public-profiles.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicProfilesController],
  providers: [PublicProfilesService],
})
export class PublicProfilesModule {}
