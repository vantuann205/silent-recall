import { mnemonicToSeedSync } from '@scure/bip39';
import {
  HDWallet,
  Roles,
  generateMnemonicWords,
  validateMnemonic,
  createKeystore,
} from '@midnight-ntwrk/wallet-sdk';
import {
  ShieldedAddress,
  ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey,
} from '@midnight-ntwrk/wallet-sdk/address-format';
import { ZswapSecretKeys } from '@midnight-ntwrk/midnight-js-protocol/ledger';

export function deriveAddresses(mnemonic: string) {
  if (!validateMnemonic(mnemonic)) throw new Error('Invalid mnemonic.');
  // Same BIP39 seed + account 0 derivation as Midnight.js WalletSeeds.fromMnemonic.
  const seed = mnemonicToSeedSync(mnemonic);
  const hd = HDWallet.fromSeed(seed);
  seed.fill(0);
  if (hd.type !== 'seedOk') throw new Error('Wallet derivation failed.');
  try {
    const result = hd.hdWallet
      .selectAccount(0)
      .selectRoles([Roles.NightExternal, Roles.Zswap])
      .deriveKeysAt(0);
    if (result.type !== 'keysDerived')
      throw new Error('Wallet derivation failed.');
    try {
      const shielded = ZswapSecretKeys.fromSeed(result.keys[Roles.Zswap]);
      return {
        unshielded: createKeystore(result.keys[Roles.NightExternal], 'preprod')
          .getBech32Address()
          .asString(),
        shielded: ShieldedAddress.codec
          .encode(
            'preprod',
            new ShieldedAddress(
              ShieldedCoinPublicKey.fromHexString(shielded.coinPublicKey),
              ShieldedEncryptionPublicKey.fromHexString(
                shielded.encryptionPublicKey,
              ),
            ),
          )
          .asString(),
      };
    } finally {
      Object.values(result.keys).forEach((key) => key.fill(0));
    }
  } finally {
    hd.hdWallet.clear();
  }
}

export function createWallets() {
  return Array.from({ length: 30 }, (_, i) => {
    const mnemonic = generateMnemonicWords().join(' ');
    return {
      id: String(i + 1).padStart(2, '0'),
      primary: i === 0,
      mnemonic,
      addresses: deriveAddresses(mnemonic),
    };
  });
}

export function publicWallets(wallets: ReturnType<typeof createWallets>) {
  return wallets.map(({ id, primary, addresses }) => ({
    id,
    primary,
    addresses,
  }));
}
