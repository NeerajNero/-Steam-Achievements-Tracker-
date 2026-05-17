import { Module } from '@nestjs/common';

import { ProfilesModule } from '../profiles/profiles.module';
import { GlobalGamesController } from './global-games.controller';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [ProfilesModule],
  controllers: [GamesController, GlobalGamesController],
  providers: [GamesService],
})
export class GamesModule {}
