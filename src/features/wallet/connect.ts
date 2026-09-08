import type {ConnectedAPI,InitialAPI,ConnectionStatus} from '@midnight-ntwrk/dapp-connector-api';
import {getConfig} from '@/lib/config/config';
export type WalletStatus='disconnected'|'connecting'|'connected'|'missing'|'wrong-network'|'error';
export function mapWalletStatus(status:ConnectionStatus,expected:string):WalletStatus{return status.status==='disconnected'?'disconnected':status.networkId===expected?'connected':'wrong-network';}
export async function connectWallet():Promise<ConnectedAPI>{const config=getConfig();const wallets=window.midnight;const wallet:InitialAPI|undefined=wallets?.mnLace??Object.values(wallets??{}).find(w=>w.apiVersion.startsWith('4.'));if(!wallet)throw new Error('WALLET_MISSING');const api=await wallet.connect(config.network);const status=mapWalletStatus(await api.getConnectionStatus(),config.network);if(status!=='connected')throw new Error(status==='wrong-network'?'WRONG_NETWORK':'DISCONNECTED');return api;}
