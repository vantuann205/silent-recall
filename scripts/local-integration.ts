import { mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { firstValueFrom, filter, timeout } from 'rxjs';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import {
  compiledContract,
  contractGateway,
  type Providers,
} from '../src/lib/midnight/contract-gateway';
import { memoryPrivateState } from '../src/lib/midnight/private-state';
import { pureCircuits } from '../contract/generated/contract/index.js';
import { text32, bytesToHex } from '../src/lib/crypto/encoding';
import { commitmentOf } from '../src/lib/crypto/commitment';
import { createCredential } from '../src/lib/validation/credential';
import { localWallet } from './local-wallet';
Object.assign(globalThis, { WebSocket });
const overall = setTimeout(() => {
  console.error('Local integration exceeded 15 minutes.');
  process.exit(1);
}, 900000);
const ctx = await localWallet();
try {
  console.log('Synchronizing isolated local genesis wallet.');
  const synced = await firstValueFrom(
    ctx.wallet.state().pipe(
      filter((s) => s.isSynced),
      timeout(180000),
    ),
  );
  const coins = synced.unshielded.availableCoins.filter(
    (c) => !c.meta.registeredForDustGeneration,
  );
  if (coins.length) {
    const recipe = await ctx.wallet.registerNightUtxosForDustGeneration(
      coins,
      ctx.keystore.getPublicKey(),
      (data) => ctx.keystore.signData(data),
    );
    await ctx.wallet.submitTransaction(await ctx.wallet.finalizeRecipe(recipe));
  }
  await firstValueFrom(
    ctx.wallet.state().pipe(
      filter((s) => s.isSynced && s.dust.balance(new Date()) > 0n),
      timeout(300000),
    ),
  );
  const zkConfigProvider = new NodeZkConfigProvider<keyof LocalCircuits>(
    'contract/generated',
  );
  const providers: Providers = {
    privateStateProvider: memoryPrivateState(),
    publicDataProvider: indexerPublicDataProvider(
      'http://127.0.0.1:18088/api/v4/graphql',
      'ws://127.0.0.1:18088/api/v4/graphql/ws',
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      'http://127.0.0.1:16300',
      zkConfigProvider,
    ),
    walletProvider: {
      getCoinPublicKey: () => ctx.shieldedSecretKeys.coinPublicKey,
      getEncryptionPublicKey: () => ctx.shieldedSecretKeys.encryptionPublicKey,
      async balanceTx(tx) {
        const recipe = await ctx.wallet.balanceUnboundTransaction(
          tx,
          {
            shieldedSecretKeys: ctx.shieldedSecretKeys,
            dustSecretKey: ctx.dustSecretKey,
          },
          { ttl: new Date(Date.now() + 1800000) },
        );
        return ctx.wallet.finalizeRecipe(recipe);
      },
    },
    midnightProvider: {
      async submitTx(tx) {
        await ctx.wallet.submitTransaction(tx);
        return tx.identifiers()[0];
      },
    },
  };
  const authority = randomBytes(32);
  console.log('Deploying SilentRecall to undeployed network.');
  const deployed = await deployContract(providers, {
    compiledContract,
    privateStateId: 'silentRecall',
    initialPrivateState: { authoritySecret: authority },
    args: [pureCircuits.authorityHash(authority), text32('ACME')],
  });
  const address = deployed.deployTxData.public.contractAddress;
  console.log('Contract deployed:', address);
  mkdirSync('.local', { recursive: true });
  writeFileSync('.local/manufacturer.key', bytesToHex(authority), {
    mode: 0o600,
  });
  writeFileSync(
    '.local/deployment.json',
    JSON.stringify({ network: 'undeployed', address }, null, 2),
  );
  const gateway = contractGateway(providers, address);
  await gateway.authorize(bytesToHex(authority));
  console.log('Manufacturer initialized.');
  const now = Math.floor(Date.now() / 1000);
  const credential = createCredential({
    manufacturerId: 'ACME',
    modelId: 'KETTLE-01',
    batchId: 'BATCH-2026',
    serialNumber: 'LOCAL-INTEGRATION-ONLY',
    purchaseDate: now - 1000,
    warrantyEligible: true,
  });
  await gateway.register(commitmentOf(credential));
  console.log('Commitment registered.');
  await gateway.createCampaign({
    id: 'RECALL-001',
    title: 'Kettle safety recall',
    manufacturerId: 'ACME',
    modelId: 'KETTLE-01',
    batchId: 'BATCH-2026',
    reason: 'Stop using the affected kettle.',
    opensAt: now - 300,
    expiresAt: now + 86400,
    purchaseFrom: 0,
    purchaseTo: now,
    warrantyRequired: true,
    voucherValue: 50,
  });
  console.log('Campaign indexed.');
  await gateway.prove('RECALL-001', credential);
  const result = await gateway.snapshot();
  assert.equal(result.verifications, 1);
  assert.equal(result.products, 1);
  console.log('Genuine eligibility proof verified on local network.');
  await assert.rejects(
    gateway.prove('RECALL-001', { ...credential, batchId: 'WRONG' }),
  );
  await gateway.closeCampaign('RECALL-001');
  await assert.rejects(gateway.prove('RECALL-001', credential));
  const summary = {
    address,
    network: 'undeployed',
    verifiedAt: new Date().toISOString(),
    products: result.products,
    verifications: result.verifications,
    checks: [
      'deployment',
      'authority',
      'registration',
      'campaign',
      'eligibility-proof',
      'wrong-batch',
      'closed-campaign',
    ],
  };
  writeFileSync(
    '.local/integration-result.json',
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary));
} finally {
  clearTimeout(overall);
  await ctx.wallet.stop();
}
type LocalCircuits =
  import('../contract/generated/contract/index.js').ProvableCircuits<
    import('../src/lib/midnight/private-state').PrivateState
  >;
