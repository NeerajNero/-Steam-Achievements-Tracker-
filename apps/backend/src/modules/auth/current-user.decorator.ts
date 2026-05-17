import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type {
  AuthenticatedUserContext,
  RequestWithAuthenticatedUser,
} from './authenticated-user.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUserContext => {
    const request = context
      .switchToHttp()
      .getRequest<Request & RequestWithAuthenticatedUser>();

    if (request.authenticatedUser === undefined) {
      throw new Error('Authenticated user context is missing.');
    }

    return request.authenticatedUser;
  },
);
