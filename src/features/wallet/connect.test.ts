import { afterEach, expect, it, vi } from 'vitest';
import { connectWallet, mapWalletStatus } from './connect';
afterEach(() => vi.unstubAllGlobals());
it('discovers v4 wallets and checks the negotiated network', async () => {
  vi.stubGlobal('window', {});
  await expect(connectWallet()).rejects.toThrow('WALLET_MISSING');
  const api = {
    getConnectionStatus: vi
      .fn()
      .mockResolvedValue({ status: 'connected', networkId: 'undeployed' }),
  };
  const connect = vi.fn().mockResolvedValue(api);
  vi.stubGlobal('window', {
    midnight: { alternative: { apiVersion: '4.0.1', connect } },
  });
  expect(await connectWallet()).toBe(api);
  api.getConnectionStatus.mockResolvedValueOnce({
    status: 'connected',
    networkId: 'preview',
  });
  await expect(connectWallet()).rejects.toThrow('WRONG_NETWORK');
  api.getConnectionStatus.mockResolvedValueOnce({ status: 'disconnected' });
  await expect(connectWallet()).rejects.toThrow('DISCONNECTED');
});
it('distinguishes disconnected and incorrect networks', () => {
  expect(mapWalletStatus({ status: 'disconnected' }, 'undeployed')).toBe(
    'disconnected',
  );
  expect(
    mapWalletStatus(
      { status: 'connected', networkId: 'preview' },
      'undeployed',
    ),
  ).toBe('wrong-network');
  expect(
    mapWalletStatus(
      { status: 'connected', networkId: 'undeployed' },
      'undeployed',
    ),
  ).toBe('connected');
});
