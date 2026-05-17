import { URLSearchParams } from 'node:url';

import { Injectable } from '@nestjs/common';
import {
  AUTH_CALLBACK_REASON_CODES,
  AuthCallbackError,
} from './auth-callback-error';
import { getAuthConfig } from './auth.config';

export interface OpenIdCallbackData {
  state?: string;
  claimedId?: string;
}

export interface VerifiedSteamIdentity {
  claimedId: string;
  steamId: string;
}

const OPENID_PROVIDER_URL = 'https://steamcommunity.com/openid/login';
const OPENID_NS = 'http://specs.openid.net/auth/2.0';
const REQUIRED_OPENID_FIELDS = [
  'openid.mode',
  'openid.claimed_id',
  'openid.identity',
  'openid.assoc_handle',
  'openid.signed',
  'openid.sig',
] as const;

@Injectable()
export class SteamOpenIdService {
  private readonly config = getAuthConfig();

  buildLoginUrl(state: string): string {
    const backendReturnTo = `${this.config.backendPublicUrl.replace(/\/+$/, '')}/auth/steam/callback`;
    const returnTo = `${backendReturnTo}?state=${encodeURIComponent(state)}`;

    const params = new URLSearchParams({
      'openid.ns': OPENID_NS,
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnTo,
      'openid.realm': this.config.backendPublicUrl,
      'openid.identity': `${OPENID_NS}/identifier_select`,
      'openid.claimed_id': `${OPENID_NS}/identifier_select`,
    });

    const loginUrl = `${OPENID_PROVIDER_URL}?${params.toString()}`;
    return loginUrl;
  }

  async verifyCallback(query: Record<string, string>): Promise<VerifiedSteamIdentity> {
    if (query['openid.mode'] === 'cancel') {
      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.OpenIdCancelled,
        'Steam OpenID login was cancelled.',
      );
    }

    if (query['openid.mode'] !== 'id_res') {
      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.OpenIdMissingRequiredFields,
        'Steam OpenID callback is missing id_res mode.',
      );
    }

    if (!hasRequiredOpenIdFields(query)) {
      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.OpenIdMissingRequiredFields,
        'Steam OpenID callback is missing required fields.',
      );
    }

    const claimedId = query['openid.claimed_id'];
    const steamId = this.extractSteamId(claimedId);
    const isValid = await this.verifyWithSteamProvider(query);

    if (!isValid) {
      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.OpenIdVerificationFailed,
        'Steam OpenID response is not valid.',
      );
    }

    return { claimedId, steamId };
  }

  getCallbackState(query: Record<string, string>): string | undefined {
    return query.state;
  }

  extractSteamId(claimedId?: string): string {
    if (typeof claimedId !== 'string' || claimedId.length === 0) {
      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.SteamIdExtractFailed,
        'Steam OpenID callback is missing claimed_id.',
      );
    }

    const match = claimedId.match(/\/openid\/id\/(\d{17})\/?$/);

    if (match === null || match[1] === undefined) {
      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.SteamIdExtractFailed,
        'Steam OpenID claimed_id is malformed.',
      );
    }

    return match[1];
  }

  private async verifyWithSteamProvider(query: Record<string, string>): Promise<boolean> {
    const body = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (key === 'openid.mode') {
        body.append(key, 'check_authentication');
      } else {
        body.append(key, value);
      }
    });

    let response: Response;

    try {
      response = await fetch(OPENID_PROVIDER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
    } catch (error: unknown) {
      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.OpenIdVerificationRequestFailed,
        'Steam OpenID verification request failed.',
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new AuthCallbackError(
        AUTH_CALLBACK_REASON_CODES.OpenIdVerificationRequestFailed,
        'Steam OpenID verification request returned a non-success status.',
      );
    }

    const text = await response.text();
    const kv = parseKeyValueResponse(text);

    return kv['is_valid'] === 'true';
  }
}

export function hasRequiredOpenIdFields(query: Record<string, string>): boolean {
  return REQUIRED_OPENID_FIELDS.every(
    (field) => typeof query[field] === 'string' && query[field].trim().length > 0,
  );
}

function parseKeyValueResponse(input: string): Record<string, string> {
  const rows = input.split('\n');
  const parsed: Record<string, string> = {};

  for (const row of rows) {
    const separator = row.indexOf(':');
    if (separator <= 0) {
      continue;
    }

    const key = row.slice(0, separator);
    const value = row.slice(separator + 1).trim();
    parsed[key] = value;
  }

  return parsed;
}
