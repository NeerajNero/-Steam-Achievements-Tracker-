import { Module } from '@nestjs/common';

import { ProfilesModule } from '../profiles/profiles.module';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

@Module({
  imports: [ProfilesModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
