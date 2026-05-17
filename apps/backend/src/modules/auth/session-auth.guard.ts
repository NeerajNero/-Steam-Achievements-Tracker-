import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import type { RequestWithAuthenticatedUser } from './authenticated-user.types';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly authCookieService: AuthCookieService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & RequestWithAuthenticatedUser>();
    const token = this.authCookieService.getSessionToken(request);

    if (token === null) {
      throw new UnauthorizedException('No active session.');
    }

    const currentUser = await this.authService.getCurrentUser(token);

    if (currentUser === null) {
      throw new UnauthorizedException('No active session.');
    }

    request.authenticatedUser = {
      ...currentUser,
      userId: currentUser.user.id,
    };

    return true;
  }
}
