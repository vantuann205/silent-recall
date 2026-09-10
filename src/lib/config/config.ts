import { z } from 'zod';
const configuration = z.object({
  network: z.enum(['undeployed', 'preview', 'preprod']),
  contractAddress: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .or(z.literal('')),
  indexerHttp: z.url(),
  indexerWs: z.url(),
  proofServer: z.url(),
});
export function getConfig() {
  const network = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK ?? 'undeployed';
  const publicNetwork = network === 'preprod' || network === 'preview';
  return configuration.parse({
    network,
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '',
    indexerHttp:
      process.env.NEXT_PUBLIC_INDEXER_HTTP ??
      (publicNetwork
        ? `https://indexer.${network}.midnight.network/api/v4/graphql`
        : 'http://127.0.0.1:18088/api/v4/graphql'),
    indexerWs:
      process.env.NEXT_PUBLIC_INDEXER_WS ??
      (publicNetwork
        ? `wss://indexer.${network}.midnight.network/api/v4/graphql/ws`
        : 'ws://127.0.0.1:18088/api/v4/graphql/ws'),
    proofServer:
      process.env.NEXT_PUBLIC_PROOF_SERVER ?? 'http://127.0.0.1:16300',
  });
}
export function demoAllowed() {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true'
  );
}
