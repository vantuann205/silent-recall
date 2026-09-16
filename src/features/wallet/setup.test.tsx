// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Setup from '@/app/manufacturer/setup/page';
const connect = vi.hoisted(() => vi.fn());
vi.mock('./connect', () => ({ connectWallet: connect }));
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it('inspects Lace without a deployed contract and keeps deployment disabled without a backup', async () => {
  vi.stubEnv('NEXT_PUBLIC_CONTRACT_ADDRESS', '');
  connect.mockResolvedValue({
    getConfiguration: async () => ({ networkId: 'preprod' }),
    getUnshieldedAddress: async () => ({ unshieldedAddress: 'wallet-01' }),
    getDustBalance: async () => ({ cap: 100n, balance: 0n }),
    getUnshieldedBalances: async () => ({ NIGHT: 5000n }),
  });
  render(<Setup />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Inspect Lace wallet' }),
  );
  expect(await screen.findByText('Wallet inspected')).toBeTruthy();
  expect(
    screen.getByText(/"unshieldedAddress": "wallet-01"/).textContent,
  ).toContain('"balance": "0"');
  expect(
    (
      screen.getByRole('button', {
        name: 'Deploy contract',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
it('recovers from a declined wallet request so it can be requested again', async () => {
  connect.mockRejectedValue(new Error('Access to wallet api denied'));
  render(<Setup />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Inspect Lace wallet' }),
  );
  expect(await screen.findByText('Access to wallet api denied')).toBeTruthy();
  expect(
    (
      screen.getByRole('button', {
        name: 'Inspect Lace wallet',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});
