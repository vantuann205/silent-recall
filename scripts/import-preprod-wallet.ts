import assert from 'node:assert/strict';
import {
  mkdirSync,
  writeFileSync,
  createReadStream,
  unlinkSync,
} from 'node:fs';
import { createInterface } from 'node:readline';
import { deriveAddresses } from './wallet-material';
import { dpapi, walletDirectory } from './wallet-vault';
import { resolve } from 'node:path';

const temporaryFile = resolve(walletDirectory, 'import-once.txt');
const fromFile = process.argv.includes('--local-file');
if (!fromFile && process.stdin.isTTY) process.stdin.setRawMode(true);
const input = createInterface({
  input: fromFile ? createReadStream(temporaryFile) : process.stdin,
  terminal: false,
});
try {
  for await (const line of input) {
    const mnemonic = line.trim().split(/\s+/).join(' ');
    const addresses = deriveAddresses(mnemonic);
    const record = JSON.stringify({ network: 'preprod', mnemonic, addresses });
    const encrypted = dpapi('protect', record);
    assert.equal(
      dpapi('unprotect', encrypted),
      record,
      'Encryption verification failed.',
    );
    mkdirSync(walletDirectory, { recursive: true });
    writeFileSync(resolve(walletDirectory, 'imported.dpapi'), encrypted, {
      flag: 'wx',
      mode: 0o600,
      flush: true,
    });
    if (fromFile) unlinkSync(temporaryFile);
    console.log(JSON.stringify({ network: 'preprod', addresses }));
    break;
  }
} catch {
  console.error(
    'Import failed: invalid mnemonic or existing encrypted file. No secrets printed.',
  );
  process.exitCode = 1;
} finally {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  input.close();
  process.stdin.destroy();
}
