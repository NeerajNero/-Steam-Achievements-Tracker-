import type { AuthenticatedSessionUser } from './auth.service';

export type AuthenticatedUserContext = AuthenticatedSessionUser & {
  userId: string;
};

export interface RequestWithAuthenticatedUser {
  authenticatedUser?: AuthenticatedUserContext;
}
