import assert from 'node:assert/strict';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
} from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { randomBytes } from 'node:crypto';
import { mnemonicToSeedSync } from '@scure/bip39';
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
import { readWalletVault, dpapi } from './wallet-vault';
import { walletFromSeed } from './local-wallet';
import { deriveAddresses } from './wallet-material';

Object.assign(globalThis, { WebSocket });
const mode = process.argv[2] ?? 'check';
assert(
  ['check', 'register', 'generate', 'deploy'].includes(mode),
  'Use check, register, generate or deploy.',
);
const walletId =
  process.argv.find((arg) => arg.startsWith('--wallet='))?.slice(9) ?? '01';
assert(/^(0[1-9]|[12][0-9]|30|imported)$/.test(walletId), 'Invalid wallet ID.');
assert(mode !== 'deploy' || walletId === '01', 'Only wallet 01 may deploy.');
const directory =
  walletId === '01' ? '.local/preprod' : `.local/preprod/wallet-${walletId}`;
const deploymentFile = `${directory}/deployment.json`;
const submissionFile = `${directory}/submission.json`;
const authorityFile = `${directory}/manufacturer.dpapi`;
mkdirSync(directory, { recursive: true });
const vault = readWalletVault();
const primary =
  walletId === 'imported'
    ? JSON.parse(
        dpapi(
          'unprotect',
          readFileSync('.local/wallets/preprod/imported.dpapi', 'utf8'),
        ),
      )
    : vault.wallets.find((w) => w.id === walletId);
assert(primary, 'Wallet is required.');
if (walletId === 'imported') {
  assert.equal(primary.network, 'preprod');
  assert.deepEqual(deriveAddresses(primary.mnemonic), primary.addresses);
}
const seed = mnemonicToSeedSync(primary.mnemonic);
const overall = setTimeout(() => {
  console.error(
    'Preprod operation exceeded its deadline; inspect submission.json before retrying.',
  );
  process.exit(1);
}, 8100000);
const ctx = await walletFromSeed(
  seed,
  'preprod',
  `${directory}/dust-state.dpapi`,
);
seed.fill(0);
assert.equal(
  ctx.keystore.getBech32Address().asString(),
  primary.addresses.unshielded,
);
let lastProgress = 0;
let checkpoint: Promise<void> | undefined;
const checkpointTimer = setInterval(() => {
  if (!checkpoint) {
    checkpoint = ctx
      .saveDustState()
      .then(() => console.log('Encrypted DUST checkpoint saved.'))
      .catch(() =>
        console.error('Checkpoint failed; existing snapshot retained.'),
      )
      .finally(() => {
        checkpoint = undefined;
      });
  }
}, 120000);
const progress = ctx.wallet.state().subscribe({
  next: (s) => {
    if (Date.now() - lastProgress > 30000) {
      lastProgress = Date.now();
      console.log(
        JSON.stringify({
          synced: s.isSynced,
          shieldedProgress:
            String(s.shielded.state.progress.appliedIndex) +
            '/' +
            String(s.shielded.state.progress.highestRelevantWalletIndex),
          dustProgress:
            String(s.dust.state.progress.appliedIndex) +
            '/' +
            String(s.dust.state.progress.highestRelevantWalletIndex),
          coins: s.unshielded.availableCoins.length,
          dust: s.dust.balance(new Date()).toString(),
        }),
      );
    }
  },
  error: () => console.error('Wallet synchronization failed.'),
});
try {
  console.log(
    `Synchronizing Preprod wallet ${walletId}:`,
    primary.addresses.unshielded,
  );
  if (mode === 'register' || mode === 'generate') {
    if (mode === 'generate') {
      await firstValueFrom(
        ctx.wallet.state().pipe(
          filter((s) => s.isSynced),
          timeout(7200000),
        ),
      );
      await ctx.saveDustState();
      console.log('Full synchronization complete; encrypted snapshot saved.');
      const journal = `${directory}/dust-registration.json`;
      if (existsSync(journal)) {
        const previous = JSON.parse(readFileSync(journal, 'utf8'));
        assert.equal(previous.network, 'preprod');
        assert.equal(previous.walletId, walletId);
        assert(
          /^[0-9a-f]{66}$/.test(previous.txId),
          'Invalid transaction identifier.',
        );
        const preparedAt = Date.parse(previous.preparedAt);
        assert(Number.isFinite(preparedAt));
        // SDK registration TTL is one hour; do not replace a potentially live transaction.
        const remaining = preparedAt + 3660000 - Date.now();
        if (remaining > 0) {
          console.log(
            'Waiting for previous transaction TTL before reconciliation:',
            Math.ceil(remaining / 1000),
            'seconds',
          );
          await sleep(remaining);
        }
        const response = await fetch(
          'https://indexer.preprod.midnight.network/api/v4/graphql',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              query:
                'query($offset: TransactionOffset!) { transactions(offset: $offset) { hash } }',
              variables: { offset: { identifier: previous.txId } },
            }),
            signal: AbortSignal.timeout(30000),
          },
        );
        assert(response.ok, 'Indexer unavailable; refusing replacement.');
        const result = await response.json();
        assert(
          !result.errors && Array.isArray(result.data?.transactions),
          'Invalid indexer result.',
        );
        console.log(
          'Previous registration indexed:',
          result.data.transactions.length > 0,
        );
        renameSync(
          journal,
          `${directory}/dust-registration-${previous.txId}.json`,
        );
      }
    }
    const state = await firstValueFrom(
      ctx.wallet.unshielded.state.pipe(
        filter((s) => s.progress.isStrictlyComplete()),
        timeout(180000),
      ),
    );
    const coins = state.availableCoins;
    assert(coins.length > 0, 'Wallet has no available NIGHT.');
    console.log(
      JSON.stringify({
        coins: coins.length,
        registered: coins.filter((c) => c.meta.registeredForDustGeneration)
          .length,
      }),
    );
    const unregistered = coins.filter(
      (c) => !c.meta.registeredForDustGeneration,
    );
    if (!unregistered.length) {
      console.log(
        'All available NIGHT is already registered; no transaction sent.',
      );
    } else {
      const journal = `${directory}/dust-registration.json`;
      assert(
        !existsSync(journal),
        'Previous registration requires reconciliation; refusing duplicate submission.',
      );
      // Registration checks its own fee allowance without replaying shielded history.
      const recipe = await ctx.wallet.registerNightUtxosForDustGeneration(
        unregistered,
        ctx.keystore.getPublicKey(),
        (data) => ctx.keystore.signData(data),
      );
      const tx = await ctx.wallet.finalizeRecipe(recipe);
      const txId = tx.identifiers()[0];
      writeFileSync(
        journal,
        JSON.stringify({
          network: 'preprod',
          walletId,
          txId,
          preparedAt: new Date().toISOString(),
          serialized: Buffer.from(tx.serialize()).toString('hex'),
        }),
        { flag: 'wx', flush: true },
      );
      console.log('Submitting DUST registration:', txId);
      await ctx.wallet.submitTransaction(tx);
      console.log('DUST registration finalized:', txId);
    }
    if (mode === 'generate') {
      const ready = await firstValueFrom(
        ctx.wallet.state().pipe(
          filter((s) => s.isSynced && s.dust.balance(new Date()) > 0n),
          timeout(600000),
        ),
      );
      await ctx.saveDustState();
      const verified = {
        network: 'preprod',
        walletId,
        address: primary.addresses.unshielded,
        dustAtomic: ready.dust.balance(new Date()).toString(),
        verifiedAt: new Date().toISOString(),
        synced: true,
      };
      writeFileSync(
        `${directory}/dust-verified.json`,
        JSON.stringify(verified, null, 2),
        { flush: true },
      );
      console.log('DUST VERIFIED:', JSON.stringify(verified));
    }
  } else {
    const synced = await firstValueFrom(
      ctx.wallet.state().pipe(
        filter((s) => s.isSynced),
        timeout(7200000),
      ),
    );
    console.log(
      JSON.stringify({
        synced: true,
        coins: synced.unshielded.availableCoins.length,
        dust: synced.dust.balance(new Date()).toString(),
      }),
    );
    await ctx.saveDustState();
    console.log('Encrypted DUST snapshot saved.');
    if (mode === 'deploy') {
      if (existsSync(submissionFile) && !existsSync(deploymentFile)) {
        throw new Error(
          'Previous submission requires reconciliation; refusing duplicate deployment.',
        );
      }
      const coins = synced.unshielded.availableCoins.filter(
        (c) => !c.meta.registeredForDustGeneration,
      );
      if (coins.length) {
        console.log('Registering wallet 01 NIGHT for DUST generation.');
        const recipe = await ctx.wallet.registerNightUtxosForDustGeneration(
          coins,
          ctx.keystore.getPublicKey(),
          (data) => ctx.keystore.signData(data),
        );
        const tx = await ctx.wallet.finalizeRecipe(recipe);
        await ctx.wallet.submitTransaction(tx);
        console.log('DUST registration submitted:', tx.identifiers()[0]);
      }
      await firstValueFrom(
        ctx.wallet.state().pipe(
          filter((s) => s.isSynced && s.dust.balance(new Date()) > 0n),
          timeout(300000),
        ),
      );
      if (!existsSync(authorityFile)) {
        assert(
          !existsSync(deploymentFile) && !existsSync(submissionFile),
          'Restore the existing deployment authority; refusing to replace it.',
        );
        writeFileSync(
          authorityFile,
          dpapi('protect', randomBytes(32).toString('hex')),
          { flag: 'wx', mode: 0o600, flush: true },
        );
      }
      const authority = Buffer.from(
        dpapi('unprotect', readFileSync(authorityFile, 'utf8')).trim(),
        'hex',
      );
      assert.equal(authority.length, 32);
      const zkConfigProvider = new NodeZkConfigProvider<
        keyof import('../contract/generated/contract/index.js').ProvableCircuits<
          import('../src/lib/midnight/private-state').PrivateState
        >
      >('contract/generated');
      let deploying = false;
      const providers: Providers = {
        privateStateProvider: memoryPrivateState(),
        publicDataProvider: indexerPublicDataProvider(
          'https://indexer.preprod.midnight.network/api/v4/graphql',
          'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
        ),
        zkConfigProvider,
        proofProvider: httpClientProofProvider(
          'http://127.0.0.1:16300',
          zkConfigProvider,
        ),
        walletProvider: {
          getCoinPublicKey: () => ctx.shieldedSecretKeys.coinPublicKey,
          getEncryptionPublicKey: () =>
            ctx.shieldedSecretKeys.encryptionPublicKey,
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
            const txId = tx.identifiers()[0];
            if (deploying)
              writeFileSync(
                submissionFile,
                JSON.stringify(
                  {
                    network: 'preprod',
                    walletId: '01',
                    txId,
                    submittedAt: new Date().toISOString(),
                  },
                  null,
                  2,
                ),
                { flag: 'wx', flush: true },
              );
            await ctx.wallet.submitTransaction(tx);
            console.log('Submitted:', txId);
            return txId;
          },
        },
      };
      let address: string;
      if (existsSync(deploymentFile)) {
        const previous = JSON.parse(readFileSync(deploymentFile, 'utf8'));
        assert.equal(previous.network, 'preprod');
        assert.equal(previous.walletId, '01');
        assert.match(previous.address, /^[0-9a-f]{64}$/);
        address = previous.address;
      } else {
        deploying = true;
        console.log('Deploying SilentRecall on Preprod.');
        const deployed = await deployContract(providers, {
          compiledContract,
          privateStateId: 'silentRecall',
          initialPrivateState: { authoritySecret: authority },
          args: [pureCircuits.authorityHash(authority), text32('ACME')],
        });
        address = deployed.deployTxData.public.contractAddress;
        deploying = false;
        writeFileSync(
          deploymentFile,
          JSON.stringify(
            {
              network: 'preprod',
              walletId: '01',
              address,
              confirmedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
          { flag: 'wx', flush: true },
        );
      }
      const gateway = contractGateway(providers, address);
      await gateway.authorize(bytesToHex(authority));
      const snapshot = await gateway.snapshot();
      assert.equal(snapshot.initialized, true);
      assert.equal(
        snapshot.authority,
        bytesToHex(pureCircuits.authorityHash(authority)),
      );
      console.log(
        JSON.stringify({ network: 'preprod', address, initialized: true }),
      );
      if (process.argv.includes('--smoke')) {
        const resultFile = `${directory}/smoke-result.json`;
        if (existsSync(resultFile)) {
          const previous = JSON.parse(readFileSync(resultFile, 'utf8'));
          assert.equal(previous.address, address);
          console.log('Smoke test already recorded:', JSON.stringify(previous));
        } else {
          const credentialFile = `${directory}/smoke-credential.dpapi`;
          assert(
            !existsSync(credentialFile),
            'Previous smoke submission requires reconciliation before retrying.',
          );
          const credential = createCredential({
            manufacturerId: 'ACME',
            modelId: 'PREPROD-SMOKE',
            batchId: 'SMOKE-001',
            serialNumber: 'PREPROD-SMOKE-001',
            purchaseDate: Math.floor(Date.now() / 1000),
            warrantyEligible: true,
          });
          writeFileSync(
            credentialFile,
            dpapi('protect', JSON.stringify(credential)),
            { flag: 'wx', mode: 0o600, flush: true },
          );
          await gateway.register(commitmentOf(credential));
          const after = await gateway.snapshot();
          assert.equal(after.products, snapshot.products + 1);
          const result = {
            network: 'preprod',
            address,
            products: after.products,
            verifiedAt: new Date().toISOString(),
            check: 'registerProductCommitment',
          };
          writeFileSync(resultFile, JSON.stringify(result, null, 2), {
            flag: 'wx',
            flush: true,
          });
          await ctx.saveDustState();
          console.log('On-chain smoke test passed:', JSON.stringify(result));
        }
      }
      authority.fill(0);
    }
  }
} finally {
  clearInterval(checkpointTimer);
  await checkpoint;
  progress.unsubscribe();
  const cleanup = setTimeout(() => {
    console.error('Wallet shutdown timed out; closing SDK connections.');
    process.exit(1);
  }, 15000);
  try {
    await ctx.wallet.stop();
  } finally {
    clearTimeout(cleanup);
    clearTimeout(overall);
  }
}
