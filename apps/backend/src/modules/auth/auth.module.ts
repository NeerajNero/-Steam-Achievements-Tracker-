import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../db/database.module';
import { SteamModule } from '../steam/steam.module';
import { AuthCookieService } from './auth-cookie.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { SessionAuthGuard } from './session-auth.guard';
import { OptionalSessionAuthGuard } from './optional-session-auth.guard';
import { SteamOpenIdService } from './steam-openid.service';

@Module({
  imports: [DatabaseModule, SteamModule],
  controllers: [AuthController],
  providers: [
    AuthCookieService,
    SessionService,
    SessionAuthGuard,
    OptionalSessionAuthGuard,
    SteamOpenIdService,
    AuthService,
  ],
  exports: [AuthCookieService, AuthService, SessionAuthGuard, OptionalSessionAuthGuard],
})
export class AuthModule {}
