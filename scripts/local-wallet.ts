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
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
} from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { dpapi } from './wallet-vault';
export async function localWallet() {
  // Published genesis seed belongs exclusively to the isolated local dev preset.
  return walletFromSeed(Buffer.from('0'.repeat(63) + '1', 'hex'), 'undeployed');
}
export async function walletFromSeed(
  seed: Uint8Array,
  network: 'undeployed' | 'preprod',
  cacheFile = '.local/preprod/dust-state.dpapi',
) {
  setNetworkId(network);
  const local = network === 'undeployed';
  const hd = HDWallet.fromSeed(seed);
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
  const keystore = createKeystore(result.keys[Roles.NightExternal], network);
  let dustSnapshot: string | undefined;
  if (!local && existsSync(cacheFile)) {
    const saved = JSON.parse(
      gunzipSync(
        Buffer.from(
          dpapi('unprotect', readFileSync(cacheFile, 'utf8')),
          'base64',
        ),
      ).toString('utf8'),
    );
    if (
      saved.network !== network ||
      saved.address !== keystore.getBech32Address().asString() ||
      typeof saved.state !== 'string'
    )
      throw new Error('DUST snapshot does not belong to this wallet.');
    dustSnapshot = saved.state;
    console.log('Restoring encrypted DUST snapshot.');
  }
  const wallet = await WalletFacade.init({
    configuration: {
      networkId: network,
      indexerClientConnection: {
        indexerHttpUrl: local
          ? 'http://127.0.0.1:18088/api/v4/graphql'
          : 'https://indexer.preprod.midnight.network/api/v4/graphql',
        indexerWsUrl: local
          ? 'ws://127.0.0.1:18088/api/v4/graphql/ws'
          : 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
      },
      provingServerUrl: new URL('http://127.0.0.1:16300'),
      relayURL: new URL(
        local ? 'ws://127.0.0.1:19944' : 'wss://rpc.preprod.midnight.network',
      ),
      txHistoryStorage: new NoOpTransactionHistoryStorage(),
      costParameters: {
        additionalFeeOverhead: 300000000000000n,
        feeBlocksMargin: 5,
      },
    },
    shielded: (config) => {
      const factory = ShieldedWallet({
        ...config,
        ...(local
          ? {}
          : { batchUpdates: { size: 1000, timeout: 100, spacing: 0 } }),
      });
      return factory.startWithSecretKeys(shieldedSecretKeys);
    },
    unshielded: (config) =>
      UnshieldedWallet(config).startWithPublicKey(
        PublicKey.fromKeyStore(keystore),
      ),
    dust: (config) => {
      const factory = DustWallet({
        ...config,
        ...(local
          ? {}
          : { batchUpdates: { size: 1000, timeout: 100, spacing: 0 } }),
      });
      return dustSnapshot
        ? factory.restore(dustSnapshot)
        : factory.startWithSecretKey(
            dustSecretKey,
            LedgerParameters.initialParameters().dust,
          );
    },
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  async function saveDustState() {
    if (local) return;
    const state = await wallet.dust.serializeState();
    const record = JSON.stringify({
      network,
      address: keystore.getBech32Address().asString(),
      state,
    });
    const encrypted = dpapi('protect', gzipSync(record).toString('base64'));
    mkdirSync('.local/preprod', { recursive: true });
    writeFileSync(`${cacheFile}.tmp`, encrypted, { mode: 0o600, flush: true });
    renameSync(`${cacheFile}.tmp`, cacheFile);
  }
  return { wallet, shieldedSecretKeys, dustSecretKey, keystore, saveDustState };
}
