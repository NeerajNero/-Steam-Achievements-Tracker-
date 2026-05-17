import { Injectable } from '@nestjs/common';

import {
  AuthCallbackRepository,
  type PersistSteamAuthCallbackInput,
  type PersistSteamAuthCallbackResult,
} from '../repositories/auth-callback.repository';

export type {
  PersistSteamAuthCallbackInput,
  PersistSteamAuthCallbackResult,
} from '../repositories/auth-callback.repository';

@Injectable()
export class AuthCallbackDataService {
  constructor(private readonly authCallbackRepository: AuthCallbackRepository) {}

  async persistSteamLogin(
    input: PersistSteamAuthCallbackInput,
  ): Promise<PersistSteamAuthCallbackResult> {
    return this.authCallbackRepository.persistSteamLogin(input);
  }
}
