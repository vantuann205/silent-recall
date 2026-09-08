import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  Transaction,
  CostModel,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { memoryPrivateState } from '@/lib/midnight/private-state';
import {
  contractGateway,
  type Providers,
} from '@/lib/midnight/contract-gateway';
import { getConfig } from '@/lib/config/config';
import { bytesToHex } from '@/lib/crypto/encoding';
import type { ProvableCircuits } from '../../../contract/generated/contract/index.js';
import type { PrivateState } from '@/lib/midnight/private-state';
function decodeHex(value: string) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(value))
    throw new Error('Invalid transaction encoding.');
  return Uint8Array.from(value.match(/../g)!, (x) => parseInt(x, 16));
}
export async function walletGateway(api: ConnectedAPI) {
  const config = getConfig();
  if (!config.contractAddress) throw new Error('CONTRACT_NOT_CONFIGURED');
  const [settings, keys] = await Promise.all([
    api.getConfiguration(),
    api.getShieldedAddresses(),
  ]);
  if (settings.networkId !== config.network) throw new Error('WRONG_NETWORK');
  setNetworkId(config.network);
  const zkConfigProvider = new FetchZkConfigProvider<
    keyof ProvableCircuits<PrivateState>
  >(new URL('/zk', window.location.origin).href);
  const proving = await api.getProvingProvider(zkConfigProvider);
  const providers: Providers = {
    privateStateProvider: memoryPrivateState(),
    publicDataProvider: indexerPublicDataProvider(
      settings.indexerUri,
      settings.indexerWsUri,
    ),
    zkConfigProvider,
    proofProvider: {
      proveTx: (tx) => tx.prove(proving, CostModel.initialCostModel()),
    },
    walletProvider: {
      getCoinPublicKey: () => keys.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => keys.shieldedEncryptionPublicKey,
      async balanceTx(tx) {
        const result = await api.balanceUnsealedTransaction(
          bytesToHex(tx.serialize()),
        );
        return Transaction.deserialize(
          'signature',
          'proof',
          'binding',
          decodeHex(result.tx),
        );
      },
    },
    midnightProvider: {
      async submitTx(tx) {
        await api.submitTransaction(bytesToHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };
  return contractGateway(providers, config.contractAddress);
}
