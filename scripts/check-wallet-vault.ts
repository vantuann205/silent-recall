import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dpapi, readWalletVault, walletDirectory } from './wallet-vault';
import { publicWallets } from './wallet-material';

// Read-only Windows check against the owner's existing encrypted inventory.
const vault = readWalletVault();
const inventory = JSON.parse(
  readFileSync(resolve(walletDirectory, 'addresses.json'), 'utf8'),
);
assert.deepEqual(inventory.wallets, publicWallets(vault.wallets));
assert.equal(inventory.network, 'preprod');
assert.equal(inventory.primaryWalletId, '01');
const ciphertext = readFileSync(
  resolve(walletDirectory, 'wallets.dpapi'),
  'utf8',
);
for (const wallet of vault.wallets) {
  assert(!JSON.stringify(inventory).includes(wallet.mnemonic));
  assert(!ciphertext.includes(wallet.mnemonic));
}
const damaged = Buffer.from(ciphertext, 'base64');
damaged[damaged.length - 1] ^= 1;
assert.throws(() => dpapi('unprotect', damaged.toString('base64')));
console.log(
  'PASS: 30 recoverable wallets; public inventory matches; corrupted ciphertext rejected.',
);
