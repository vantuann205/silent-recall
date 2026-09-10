import { expect, it } from 'vitest';
import {
  createWallets,
  deriveAddresses,
  publicWallets,
} from '../scripts/wallet-material';

it('creates 30 independent Preprod wallets with only wallet 01 primary', () => {
  const wallets = createWallets();
  expect(wallets).toHaveLength(30);
  expect(new Set(wallets.map((w) => w.mnemonic)).size).toBe(30);
  expect(new Set(wallets.map((w) => w.addresses.unshielded)).size).toBe(30);
  expect(wallets.filter((w) => w.primary).map((w) => w.id)).toEqual(['01']);
  for (const w of wallets) {
    expect(w.mnemonic.split(' ')).toHaveLength(24);
    expect(deriveAddresses(w.mnemonic)).toEqual(w.addresses);
    expect(w.addresses.unshielded).toMatch(/^mn_addr_preprod1/);
    expect(w.addresses.shielded).toMatch(/^mn_shield-addr_preprod1/);
  }
  const publicJson = JSON.stringify(publicWallets(wallets));
  expect(publicJson).not.toContain('mnemonic');
  expect(publicJson).not.toContain(wallets[0].mnemonic);
});

it('rejects invalid mnemonics and reproduces the official test mnemonic', () => {
  expect(() => deriveAddresses('not a valid wallet')).toThrow();
  const mnemonic = `${'abandon '.repeat(23)}diesel`;
  expect(deriveAddresses(mnemonic).unshielded).toBe(
    'mn_addr_preprod1nqhdatus5d6tvye57q854kdrs6ur2ytsl8yaygzfsdy2e3tvtmeshrjlk2',
  );
});
