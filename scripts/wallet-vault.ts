import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
  createWallets,
  deriveAddresses,
  publicWallets,
} from './wallet-material';

export const walletDirectory = fileURLToPath(
  new URL('../.local/wallets/preprod/', import.meta.url),
);
const vaultFile = resolve(walletDirectory, 'wallets.dpapi');
const publicFile = resolve(walletDirectory, 'addresses.json');
const schema = z.object({
  version: z.literal(1),
  network: z.literal('preprod'),
  createdAt: z.iso.datetime(),
  primaryWalletId: z.literal('01'),
  wallets: z
    .array(
      z.object({
        id: z.string(),
        primary: z.boolean(),
        mnemonic: z.string(),
        addresses: z.object({ unshielded: z.string(), shielded: z.string() }),
      }),
    )
    .length(30),
});

export function dpapi(mode: 'protect' | 'unprotect', input: string) {
  if (process.platform !== 'win32')
    throw new Error('Windows DPAPI is required.');
  const ps = resolve(
    process.env.SystemRoot ?? 'C:/Windows',
    'System32/WindowsPowerShell/v1.0/powershell.exe',
  );
  const result = spawnSync(
    ps,
    [
      '-NoProfile',
      '-NonInteractive',
      '-File',
      fileURLToPath(new URL('./wallet-dpapi.ps1', import.meta.url)),
      '-Mode',
      mode,
    ],
    {
      input,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0)
    throw new Error('DPAPI failed. Use the original Windows account.');
  return result.stdout;
}

export function readWalletVault() {
  const vault = schema.parse(
    JSON.parse(dpapi('unprotect', readFileSync(vaultFile, 'utf8'))),
  );
  const ids = vault.wallets.map((w) => w.id);
  if (
    ids.some((id, i) => id !== String(i + 1).padStart(2, '0')) ||
    vault.wallets.some((w, i) => w.primary !== (i === 0)) ||
    new Set(vault.wallets.map((w) => w.mnemonic)).size !== 30
  ) {
    throw new Error('Invalid wallet inventory.');
  }
  for (const w of vault.wallets) {
    const derived = deriveAddresses(w.mnemonic);
    if (
      derived.unshielded !== w.addresses.unshielded ||
      derived.shielded !== w.addresses.shielded
    ) {
      throw new Error('Wallet address verification failed.');
    }
  }
  return vault;
}

function main() {
  const command = process.argv[2];
  if (command === 'create') {
    if (existsSync(vaultFile) || existsSync(publicFile))
      throw new Error('Wallet files already exist; refusing overwrite.');
    const vault = {
      version: 1,
      network: 'preprod',
      createdAt: new Date().toISOString(),
      primaryWalletId: '01',
      wallets: createWallets(),
    };
    const json = JSON.stringify(vault);
    const encrypted = dpapi('protect', json);
    if (dpapi('unprotect', encrypted) !== json)
      throw new Error('DPAPI round-trip failed.');
    mkdirSync(walletDirectory, { recursive: true });
    writeFileSync(vaultFile, encrypted, {
      flag: 'wx',
      mode: 0o600,
      flush: true,
    });
    writeFileSync(
      publicFile,
      JSON.stringify(
        { ...vault, wallets: publicWallets(vault.wallets) },
        null,
        2,
      ),
      { flag: 'wx', mode: 0o600, flush: true },
    );
  } else if (command !== 'verify' && command !== 'reveal') {
    throw new Error(
      'Usage: pnpm exec tsx scripts/wallet-vault.ts create|verify|reveal [01..30]',
    );
  }
  const vault = readWalletVault();
  if (command === 'reveal') {
    // Intentional user-only display; automation should use readWalletVault() in memory.
    if (!process.stdout.isTTY)
      throw new Error(
        'Reveal requires an interactive terminal. Never redirect mnemonic output.',
      );
    const wallet = vault.wallets.find((w) => w.id === process.argv[3]);
    if (!wallet) throw new Error('Choose a wallet ID from 01 to 30.');
    console.log(wallet.mnemonic);
  } else {
    console.log(
      JSON.stringify(
        {
          network: vault.network,
          count: vault.wallets.length,
          primaryWalletId: vault.primaryWalletId,
          primaryAddress: vault.wallets[0].addresses.unshielded,
          vaultFile,
          publicFile,
          verified: true,
        },
        null,
        2,
      ),
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    main();
  } catch {
    console.error(
      'Wallet operation failed. Check the command, file existence and original Windows account. No secrets printed.',
    );
    process.exitCode = 1;
  }
}
