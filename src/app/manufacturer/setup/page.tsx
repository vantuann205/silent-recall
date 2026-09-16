'use client';
import { useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { Wallet, RefreshCw, Upload, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { connectWallet } from '@/features/wallet/connect';
import { getConfig } from '@/lib/config/config';
import { hex32, bytesToHex, text32 } from '@/lib/crypto/encoding';

export default function Setup() {
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState('');
  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);
  async function inspect() {
    setBusy(true);
    setMessage('Reading wallet');
    setDetails(
      JSON.stringify(
        {
          midnightProviders: Object.keys(window.midnight ?? {}),
          cardanoProviders: Object.keys(Reflect.get(window, 'cardano') ?? {}),
        },
        null,
        2,
      ),
    );
    try {
      const connected = api ?? (await connectWallet());
      setApi(connected);
      const [configuration, unshielded, dust, balances] = await Promise.all([
        connected.getConfiguration(),
        connected.getUnshieldedAddress(),
        connected.getDustBalance(),
        connected.getUnshieldedBalances(),
      ]);
      setDetails(
        JSON.stringify(
          { configuration, ...unshielded, dust, balances },
          (_, value) => (typeof value === 'bigint' ? value.toString() : value),
          2,
        ),
      );
      setMessage('Wallet inspected');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Wallet inspection failed',
      );
    } finally {
      setBusy(false);
    }
  }
  async function deploy() {
    if (!api || busy || submitted || getConfig().contractAddress) return;
    setBusy(true);
    try {
      if (getConfig().network !== 'preprod')
        throw new Error('Preprod is required');
      const authority = hex32(key);
      const dust = await api.getDustBalance();
      if (dust.balance <= 0n)
        throw new Error('Wallet has no DUST for transaction fees');
      if (sessionStorage.getItem('silentRecall.preprod.submission'))
        throw new Error(
          'An earlier submission needs reconciliation before another deployment',
        );
      setMessage('Preparing deployment');
      const [
        { walletProviders },
        { deployContract },
        { compiledContract, contractGateway },
        { pureCircuits },
      ] = await Promise.all([
        import('@/features/wallet/providers'),
        import('@midnight-ntwrk/midnight-js-contracts'),
        import('@/lib/midnight/contract-gateway'),
        import('../../../../contract/generated/contract/index.js'),
      ]);
      const providers = await walletProviders(api);
      const submit = providers.midnightProvider.submitTx;
      providers.midnightProvider.submitTx = async (tx) => {
        setSubmitted(true);
        const txId = tx.identifiers()[0];
        sessionStorage.setItem('silentRecall.preprod.submission', txId);
        setMessage(`Submitting ${txId}`);
        return submit(tx);
      };
      const result = await deployContract(providers, {
        compiledContract,
        privateStateId: 'silentRecall',
        initialPrivateState: { authoritySecret: authority },
        args: [pureCircuits.authorityHash(authority), text32('ACME')],
      });
      const deployedAddress = result.deployTxData.public.contractAddress;
      setAddress(deployedAddress);
      sessionStorage.setItem('silentRecall.preprod.address', deployedAddress);
      providers.midnightProvider.submitTx = submit;
      setMessage('Deployment confirmed; initializing manufacturer');
      await contractGateway(providers, deployedAddress).authorize(
        bytesToHex(authority),
      );
      authority.fill(0);
      setKey('');
      setMessage('Deployment and initialization confirmed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Deployment failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Preprod setup</h1>
      </div>
      <Button onClick={inspect} disabled={busy}>
        {api ? <RefreshCw /> : <Wallet />}
        {api ? 'Refresh wallet' : 'Inspect Lace wallet'}
      </Button>
      {details && (
        <pre className="my-6 whitespace-pre-wrap break-all text-sm">
          {details}
        </pre>
      )}
      <div className="my-6 max-w-xl">
        <label htmlFor="authority-file" className="flex items-center gap-2">
          <Upload size={18} />
          Manufacturer authority backup
        </label>
        <input
          id="authority-file"
          type="file"
          disabled={busy}
          accept=".key,.txt"
          onChange={async (event) => {
            try {
              const file = event.target.files?.[0];
              if (!file || file.size > 256)
                throw new Error(
                  'Select a 32-byte hexadecimal authority backup',
                );
              const value = (await file.text()).trim();
              hex32(value);
              setKey(value);
              setMessage('Authority backup loaded');
            } catch {
              setKey('');
              setMessage('Invalid authority backup');
            }
          }}
        />
      </div>
      <Button
        onClick={deploy}
        disabled={
          !api || !key || busy || submitted || !!getConfig().contractAddress
        }
      >
        <Rocket />
        Deploy contract
      </Button>
      <p className="my-4 break-all" role="status">
        {message}
      </p>
      {address && (
        <p className="break-all">
          Contract address: <code>{address}</code>
        </p>
      )}
    </div>
  );
}
