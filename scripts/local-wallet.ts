// Adapted from midnightntwrk/create-mn-app 0.5.1, Apache-2.0.
import {
  WalletFacade,
  DustWallet,
  HDWallet,
  Roles,
  ShieldedWallet,
  createKeystore,
  NoOpTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk';
import {
  ZswapSecretKeys,
  DustSecretKey,
  LedgerParameters,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
export async function localWallet() {
  setNetworkId('undeployed');
  // Published genesis seed belongs exclusively to the isolated local dev preset.
  const hd = HDWallet.fromSeed(Buffer.from('0'.repeat(63) + '1', 'hex'));
  if (hd.type !== 'seedOk') throw new Error('Local seed derivation failed.');
  const result = hd.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  hd.hdWallet.clear();
  if (result.type !== 'keysDerived')
    throw new Error('Local key derivation failed.');
  const shieldedSecretKeys = ZswapSecretKeys.fromSeed(result.keys[Roles.Zswap]);
  const dustSecretKey = DustSecretKey.fromSeed(result.keys[Roles.Dust]);
  const keystore = createKeystore(
    result.keys[Roles.NightExternal],
    'undeployed',
  );
  const wallet = await WalletFacade.init({
    configuration: {
      networkId: 'undeployed',
      indexerClientConnection: {
        indexerHttpUrl: 'http://127.0.0.1:18088/api/v4/graphql',
        indexerWsUrl: 'ws://127.0.0.1:18088/api/v4/graphql/ws',
      },
      provingServerUrl: new URL('http://127.0.0.1:16300'),
      relayURL: new URL('ws://127.0.0.1:19944'),
      txHistoryStorage: new NoOpTransactionHistoryStorage(),
      costParameters: {
        additionalFeeOverhead: 300000000000000n,
        feeBlocksMargin: 5,
      },
    },
    shielded: (config) =>
      ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (config) =>
      UnshieldedWallet(config).startWithPublicKey(
        PublicKey.fromKeyStore(keystore),
      ),
    dust: (config) =>
      DustWallet(config).startWithSecretKey(
        dustSecretKey,
        LedgerParameters.initialParameters().dust,
      ),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  return { wallet, shieldedSecretKeys, dustSecretKey, keystore };
}
