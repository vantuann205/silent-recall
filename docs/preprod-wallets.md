# Preprod Test Wallets

These are disposable test identities, never wallets for real assets. All 30
wallets have independent 24-word BIP39 mnemonics, empty BIP39 passphrases, and
account/key index 0. Wallet **01** is the primary deployment and interaction
wallet, not the parent seed of wallets 02-30.

## Recovery Location

Relative to the repository root:

- `.local/wallets/preprod/wallets.dpapi`: all 30 mnemonics, Windows DPAPI encrypted.
- `.local/wallets/preprod/addresses.json`: public address inventory; no mnemonics.
- `.local/wallets/preprod/status.json`: local funding/deployment progress, when present.
- `scripts/wallet-vault.ts`: creation, verification and recovery entry point.
- `scripts/wallet-dpapi.ps1`: DPAPI CurrentUser protection implementation.

On the current workstation the root is `F:\stellar\duan1-midnight-grant`.
Both wallet files are ignored by Git. Never recreate or overwrite this vault
when resuming work. Never print it into agent output, logs, screenshots or CI.

```powershell
pnpm exec tsx scripts/wallet-vault.ts verify
```

This decrypts in memory, validates all 30 mnemonic/address pairs and prints only
public metadata. Future local scripts may import `readWalletVault()` and select
`wallets.find(w => w.id === '01')`; they must not log the returned object.
Secrets are passed to PowerShell over stdin, never command-line arguments.

Run `pnpm exec tsx scripts/check-wallet-vault.ts` for the read-only Windows check
of recovery, public inventory consistency and rejection of damaged ciphertext.
This check requires an existing local vault and is intentionally not run in CI.

For the owner to import one wallet into Lace, run in a private interactive terminal:

```powershell
pnpm exec tsx scripts/wallet-vault.ts reveal 01
```

This intentionally displays only the chosen mnemonic to the owner. It refuses
redirected output. Do not run it in recorded/shared terminals. Import as an
existing wallet, select Midnight **Preprod**, and compare its unshielded address
with wallet 01 in `addresses.json` before requesting funds or signing.

DPAPI needs the original Windows account and its protected key material, normally
on this machine. Copying the ciphertext alone to another PC is not a portable
backup. Before reinstalling Windows or deleting the account, recover and back up
the mnemonics using an owner-controlled secure backup. DPAPI does not protect
against malicious software already running as the same user. JavaScript strings
cannot be reliably wiped from process memory. This vault is test-only.

## Network and Funding

Set `NEXT_PUBLIC_MIDNIGHT_NETWORK=preprod`, use the Preprod indexer endpoints,
and keep `NEXT_PUBLIC_ENABLE_DEMO=false`. Do not reuse a local `undeployed`
contract address. The contract address stays empty until a real deployment is
confirmed on Preprod. Browser proving uses Lace's configuration.

Official sources:

- [Network compatibility and endpoints](https://github.com/midnightntwrk/midnight-sdk/blob/main/COMPATIBILITY.md)
- [Preprod faucet](https://faucet.preprod.midnight.network/)
- [SDK mnemonic derivation](https://github.com/midnightntwrk/midnight-js/blob/main/testkit-js/testkit-js/src/wallet/wallet-seed.ts)

Request test tokens for wallet 01 only for the single-wallet test. Respect faucet
limits; do not rotate the remaining wallets to bypass them. Creation of keys is
not evidence of importing into Lace, funding, deploying or browser signing.
Record those outcomes separately with transaction IDs when actually confirmed.
