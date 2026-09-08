// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { Providers } from '@/lib/midnight/contract-gateway';
const mocks = vi.hoisted(() => ({
  gateway: vi.fn(),
  deserialize: vi.fn(),
  network: vi.fn(),
  indexer: vi.fn(),
}));
vi.mock('@/lib/midnight/contract-gateway', () => ({
  contractGateway: mocks.gateway,
}));
vi.mock('@midnight-ntwrk/midnight-js-indexer-public-data-provider', () => ({
  indexerPublicDataProvider: mocks.indexer,
}));
vi.mock('@midnight-ntwrk/midnight-js-network-id', () => ({
  setNetworkId: mocks.network,
}));
vi.mock('@midnight-ntwrk/midnight-js-protocol/ledger', () => ({
  Transaction: { deserialize: mocks.deserialize },
  CostModel: { initialCostModel: () => ({}) },
}));
import { walletGateway } from './providers';
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_CONTRACT_ADDRESS', 'ab'.repeat(32));
});
function api() {
  return {
    getConfiguration: vi
      .fn()
      .mockResolvedValue({
        networkId: 'undeployed',
        indexerUri: 'http://localhost',
        indexerWsUri: 'ws://localhost',
      }),
    getShieldedAddresses: vi
      .fn()
      .mockResolvedValue({
        shieldedCoinPublicKey: 'coin',
        shieldedEncryptionPublicKey: 'enc',
      }),
    getProvingProvider: vi.fn().mockResolvedValue('prover'),
    balanceUnsealedTransaction: vi.fn().mockResolvedValue({ tx: 'abcd' }),
    submitTransaction: vi.fn().mockResolvedValue(undefined),
  };
}
it('refuses missing deployments and network mismatch before building providers', async () => {
  const a = api();
  vi.stubEnv('NEXT_PUBLIC_CONTRACT_ADDRESS', '');
  await expect(walletGateway(a as unknown as ConnectedAPI)).rejects.toThrow(
    'CONTRACT_NOT_CONFIGURED',
  );
  vi.stubEnv('NEXT_PUBLIC_CONTRACT_ADDRESS', 'ab'.repeat(32));
  a.getConfiguration.mockResolvedValue({
    networkId: 'preview',
    indexerUri: 'http://localhost',
    indexerWsUri: 'ws://localhost',
  });
  await expect(walletGateway(a as unknown as ConnectedAPI)).rejects.toThrow(
    'WRONG_NETWORK',
  );
  expect(mocks.gateway).not.toHaveBeenCalled();
});
it('proves, balances and submits using connector v4 and rejects malformed transaction hex', async () => {
  const a = api();
  await walletGateway(a as unknown as ConnectedAPI);
  const p = mocks.gateway.mock.calls[0][0] as Providers;
  expect(p.walletProvider.getCoinPublicKey()).toBe('coin');
  expect(p.walletProvider.getEncryptionPublicKey()).toBe('enc');
  const tx = {
    serialize: () => new Uint8Array([171, 205]),
    identifiers: () => ['id'],
    prove: vi.fn().mockResolvedValue('proof'),
  };
  await p.proofProvider.proveTx(tx as never);
  expect(tx.prove).toHaveBeenCalledWith('prover', {});
  await p.walletProvider.balanceTx(tx as never);
  expect(a.balanceUnsealedTransaction).toHaveBeenCalledWith('abcd');
  expect(mocks.deserialize).toHaveBeenCalledWith(
    'signature',
    'proof',
    'binding',
    new Uint8Array([171, 205]),
  );
  expect(await p.midnightProvider.submitTx(tx as never)).toBe('id');
  a.balanceUnsealedTransaction.mockResolvedValue({ tx: 'bad-hex' });
  await expect(p.walletProvider.balanceTx(tx as never)).rejects.toThrow(
    'Invalid transaction encoding',
  );
});
