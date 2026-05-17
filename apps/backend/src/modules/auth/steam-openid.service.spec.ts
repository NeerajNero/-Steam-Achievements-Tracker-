import { afterEach, describe, expect, it, vi } from 'vitest';

import { SteamApiConfigError } from '../steam/steam-api.errors';
import { SteamOpenIdService } from './steam-openid.service';

describe('SteamOpenIdService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts a SteamID64 from the claimed identity URL', () => {
    const service = new SteamOpenIdService();

    expect(
      service.extractSteamId(
        'https://steamcommunity.com/openid/id/76561198000000000',
      ),
    ).toBe('76561198000000000');
  });

  it('rejects malformed claimed identity URLs', () => {
    const service = new SteamOpenIdService();

    expect(() =>
      service.extractSteamId('https://example.com/openid/id/not-steam'),
    ).toThrow(SteamApiConfigError);
  });

  it('verifies OpenID callbacks server-side without live Steam calls', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('ns:http://specs.openid.net/auth/2.0\nis_valid:true\n')),
    );
    const service = new SteamOpenIdService();

    await expect(
      service.verifyCallback({
        'openid.mode': 'id_res',
        'openid.claimed_id':
          'https://steamcommunity.com/openid/id/76561198000000000',
      }),
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
      service.verifyCallback({
        'openid.mode': 'id_res',
        'openid.claimed_id':
          'https://steamcommunity.com/openid/id/76561198000000000',
      }),
    ).rejects.toBeInstanceOf(SteamApiConfigError);
  });
});
