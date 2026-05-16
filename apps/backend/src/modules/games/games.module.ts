import { Module } from '@nestjs/common';

import { ProfilesModule } from '../profiles/profiles.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [ProfilesModule],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
