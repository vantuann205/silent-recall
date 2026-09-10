'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { RecallGateway, PublicSnapshot } from '@/lib/midnight/gateway';
import type { Credential } from '@/lib/validation/credential';
import { demoAllowed, getConfig } from '@/lib/config/config';
import {
  connectWallet,
  type WalletStatus,
  mapWalletStatus,
} from '@/features/wallet/connect';
import { safeError, RecallError } from '@/lib/midnight/errors';
import { CheckCircle2, X } from 'lucide-react';
const empty: PublicSnapshot = {
  manufacturerId: '',
  authority: '',
  initialized: false,
  products: 0,
  verifications: 0,
  campaigns: [],
};
interface Session {
  gateway: RecallGateway | null;
  status: WalletStatus;
  credential: Credential | null;
  setCredential: (c: Credential | null) => void;
  connect: () => Promise<void>;
  startDemo: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: string;
  authorized: boolean;
  authorize: (key: string) => Promise<void>;
  data: PublicSnapshot;
  loading: boolean;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}
const Context = createContext<Session | null>(null);
export function useRecall() {
  const value = useContext(Context);
  if (!value) throw new Error('Recall provider is missing.');
  return value;
}
function SessionProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [gateway, setGateway] = useState<RecallGateway | null>(null);
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [error, setError] = useState('');
  const [credential, setCredential] = useState<Credential | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [toast, setToast] = useState('');
  const query = useQuery({
    queryKey: ['recall', gateway?.mode ?? 'public'],
    queryFn: async () => {
      if (gateway) return gateway.snapshot();
      if (!getConfig().contractAddress) return empty;
      const [{ indexerPublicDataProvider }, { ledger }, { publicSnapshot }] =
        await Promise.all([
          import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'),
          import('../../contract/generated/contract/index.js'),
          import('@/lib/midnight/mapping'),
        ]);
      const c = getConfig();
      const s = await indexerPublicDataProvider(
        c.indexerHttp,
        c.indexerWs,
      ).queryContractState(c.contractAddress);
      if (!s) throw new RecallError('UNAVAILABLE');
      return publicSnapshot(ledger(s.data));
    },
    retry: 1,
    refetchInterval: 30000,
  });
  async function refresh() {
    await client.invalidateQueries({ queryKey: ['recall'] });
  }
  async function disconnect() {
    await gateway?.disconnect();
    setApi(null);
    setStatus('disconnected');
    setAuthorized(false);
    setCredential(null);
    setError('');
  }
  async function connect() {
    setStatus('connecting');
    setError('');
    try {
      if (gateway?.mode === 'demo') {
        setStatus('connected');
        return;
      }
      const api = await connectWallet();
      const { walletGateway } = await import('@/features/wallet/providers');
      setGateway(await walletGateway(api));
      setApi(api);
      setStatus('connected');
    } catch (e) {
      setApi(null);
      setGateway(null);
      setAuthorized(false);
      setCredential(null);
      const message = e instanceof Error ? e.message : '';
      setStatus(
        message === 'WALLET_MISSING'
          ? 'missing'
          : message === 'WRONG_NETWORK'
            ? 'wrong-network'
            : 'error',
      );
      setError(
        message === 'WALLET_MISSING'
          ? 'Lace wallet was not found. Install a compatible Midnight wallet, then retry.'
          : message === 'WRONG_NETWORK'
            ? 'Switch your wallet to the configured Midnight network and reconnect.'
            : message === 'CONTRACT_NOT_CONFIGURED'
              ? 'The contract deployment address has not been configured.'
              : safeError(e),
      );
    }
  }
  async function startDemo() {
    if (!demoAllowed()) return;
    await gateway?.disconnect();
    const { demoGateway } = await import('@/lib/midnight/demo-gateway');
    setGateway(demoGateway());
    setApi(null);
    setStatus('connected');
    setError('');
    setAuthorized(false);
    setCredential(null);
    await client.resetQueries({ queryKey: ['recall'] });
  }
  async function authorize(key: string) {
    if (!gateway || status !== 'connected')
      throw new RecallError('DISCONNECTED');
    await gateway.authorize(key);
    setAuthorized(true);
    await refresh();
  }
  useEffect(() => {
    if (!api) return;
    const timer = setInterval(() => {
      void api
        .getConnectionStatus()
        .then((s) => {
          const mapped = mapWalletStatus(s, getConfig().network);
          setStatus(mapped);
          if (mapped !== 'connected') {
            setAuthorized(false);
            setCredential(null);
            void gateway?.disconnect();
          }
        })
        .catch(() => {
          setStatus('disconnected');
          setAuthorized(false);
          setCredential(null);
          void gateway?.disconnect();
        });
    }, 5000);
    return () => clearInterval(timer);
  }, [api, gateway]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <Context.Provider
      value={{
        gateway,
        status,
        credential,
        setCredential,
        connect,
        startDemo,
        disconnect,
        error: error || (query.error ? safeError(query.error) : ''),
        authorized,
        authorize,
        data: query.data ?? empty,
        loading: query.isPending,
        refresh,
        notify: setToast,
      }}
    >
      {children}
      {toast ? (
        <div className="toast" role="status">
          <CheckCircle2 size={20} aria-hidden="true" />
          <span>{toast}</span>
          <button
            type="button"
            className="toast-dismiss"
            aria-label="Dismiss notification"
            title="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={18} />
          </button>
        </div>
      ) : null}
    </Context.Provider>
  );
}
export function RecallProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
