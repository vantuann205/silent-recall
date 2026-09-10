import { afterEach, expect, it, vi } from 'vitest';
import { getConfig, demoAllowed } from './config';
afterEach(() => vi.unstubAllEnvs());
it('has isolated local endpoints', () =>
  expect(getConfig().network).toBe('undeployed'));
it('rejects unsafe networks and malformed addresses', () => {
  vi.stubEnv('NEXT_PUBLIC_MIDNIGHT_NETWORK', 'mainnet');
  expect(getConfig).toThrow();
});
it('cannot enable simulation in production', () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO', 'true');
  expect(demoAllowed()).toBe(false);
});
it.each(['preprod', 'preview'])(
  'uses matching public indexers for %s',
  (network) => {
    vi.stubEnv('NEXT_PUBLIC_MIDNIGHT_NETWORK', network);
    vi.stubEnv('NEXT_PUBLIC_INDEXER_HTTP', undefined);
    vi.stubEnv('NEXT_PUBLIC_INDEXER_WS', undefined);
    const config = getConfig();
    expect(config.indexerHttp).toBe(
      `https://indexer.${network}.midnight.network/api/v4/graphql`,
    );
    expect(config.indexerWs).toBe(
      `wss://indexer.${network}.midnight.network/api/v4/graphql/ws`,
    );
  },
);
it('keeps explicit endpoint overrides', () => {
  vi.stubEnv('NEXT_PUBLIC_MIDNIGHT_NETWORK', 'preprod');
  vi.stubEnv(
    'NEXT_PUBLIC_INDEXER_HTTP',
    'https://indexer.example/api/v4/graphql',
  );
  expect(getConfig().indexerHttp).toBe(
    'https://indexer.example/api/v4/graphql',
  );
});
