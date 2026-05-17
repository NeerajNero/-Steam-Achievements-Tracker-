import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AUTH_CALLBACK_REASON_CODES,
  AuthCallbackError,
} from './auth-callback-error';
import { SteamOpenIdService } from './steam-openid.service';

describe('SteamOpenIdService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts a SteamID64 from https and http claimed identity URLs', () => {
    const service = new SteamOpenIdService();

    expect(
      service.extractSteamId(
        'https://steamcommunity.com/openid/id/76561198000000000',
      ),
    ).toBe('76561198000000000');
    expect(
      service.extractSteamId(
        'http://steamcommunity.com/openid/id/76561198000000000',
      ),
    ).toBe('76561198000000000');
  });

  it('rejects malformed claimed identity URLs', () => {
    const service = new SteamOpenIdService();

    expect(() =>
      service.extractSteamId('https://example.com/openid/id/not-steam'),
    ).toThrow(AuthCallbackError);
  });

  it('verifies OpenID callbacks server-side without live Steam calls', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('ns:http://specs.openid.net/auth/2.0\nis_valid:true\n')),
    );
    const service = new SteamOpenIdService();

    await expect(
      service.verifyCallback(createOpenIdCallbackQuery()),
    ).resolves.toEqual({
      claimedId: 'https://steamcommunity.com/openid/id/76561198000000000',
      steamId: '76561198000000000',
    });
  });

  it('rejects invalid OpenID assertions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('is_valid:false\n')),
    );
    const service = new SteamOpenIdService();

    await expect(
      service.verifyCallback(createOpenIdCallbackQuery()),
    ).rejects.toMatchObject({
      reasonCode: AUTH_CALLBACK_REASON_CODES.OpenIdVerificationFailed,
    });
  });

  it('rejects cancelled OpenID callbacks with a safe reason code', async () => {
    const service = new SteamOpenIdService();

    await expect(
      service.verifyCallback({ 'openid.mode': 'cancel' }),
    ).rejects.toMatchObject({
      reasonCode: AUTH_CALLBACK_REASON_CODES.OpenIdCancelled,
    });
  });

  it('rejects OpenID callbacks missing required fields', async () => {
    const service = new SteamOpenIdService();

    await expect(
      service.verifyCallback({
        'openid.mode': 'id_res',
        'openid.claimed_id':
          'https://steamcommunity.com/openid/id/76561198000000000',
      }),
    ).rejects.toMatchObject({
      reasonCode: AUTH_CALLBACK_REASON_CODES.OpenIdMissingRequiredFields,
    });
  });

  it('uses a request-failed reason code when Steam verification cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network unavailable');
      }),
    );
    const service = new SteamOpenIdService();

    await expect(
      service.verifyCallback(createOpenIdCallbackQuery()),
    ).rejects.toMatchObject({
      reasonCode: AUTH_CALLBACK_REASON_CODES.OpenIdVerificationRequestFailed,
    });
  });
});

function createOpenIdCallbackQuery(): Record<string, string> {
  return {
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'id_res',
    'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
    'openid.claimed_id':
      'https://steamcommunity.com/openid/id/76561198000000000',
    'openid.identity':
      'https://steamcommunity.com/openid/id/76561198000000000',
    'openid.return_to':
      'http://localhost:3000/auth/steam/callback?state=state-1',
    'openid.response_nonce': 'nonce',
    'openid.assoc_handle': 'assoc',
    'openid.signed': 'signed-fields',
    'openid.sig': 'signature',
  };
}
