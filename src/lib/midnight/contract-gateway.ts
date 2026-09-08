import {
  findDeployedContract,
  type ContractProviders,
  type FoundContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import {
  Contract,
  ledger,
  pureCircuits,
} from '../../../contract/generated/contract/index.js';
import { encodeOpening } from '../crypto/commitment';
import { hex32, text32, bytesToHex } from '../crypto/encoding';
import { encodeCampaign, publicSnapshot } from './mapping';
import { witnesses, type PrivateState } from './private-state';
import type { RecallGateway } from './gateway';
import { RecallError } from './errors';
export const privateStateId = 'silentRecall';
export const compiledContract = CompiledContract.make(
  'SilentRecall',
  Contract<PrivateState>,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets('contract/generated'),
);
export type Providers = ContractProviders<Contract<PrivateState>>;
export function contractGateway(
  providers: Providers,
  address: string,
): RecallGateway {
  let authority: Uint8Array | undefined;
  const snapshot = async () => {
    const state =
      await providers.publicDataProvider.queryContractState(address);
    if (!state) throw new RecallError('UNAVAILABLE');
    return publicSnapshot(ledger(state.data));
  };
  let busy = false;
  async function transact(
    work: (contract: FoundContract<Contract<PrivateState>>) => Promise<unknown>,
    opening?: PrivateState['opening'],
  ) {
    if (busy) throw new RecallError('UNAVAILABLE');
    busy = true;
    try {
      const contract = await findDeployedContract(providers, {
        compiledContract,
        contractAddress: address,
        privateStateId,
        initialPrivateState: { authoritySecret: authority, opening },
      });
      await providers.privateStateProvider.set(privateStateId, {
        authoritySecret: authority,
        opening,
      });
      await work(contract);
    } finally {
      await providers.privateStateProvider.remove(privateStateId);
      busy = false;
    }
  }
  return {
    mode: 'midnight',
    snapshot,
    async authorize(secret) {
      const key = hex32(secret);
      const current = await snapshot();
      if (bytesToHex(pureCircuits.authorityHash(key)) !== current.authority)
        throw new RecallError('UNAUTHORIZED');
      authority = key;
      if (!current.initialized)
        await transact((c) => c.callTx.initializeManufacturer());
    },
    async register(commitment) {
      await transact((c) =>
        c.callTx.registerProductCommitment(hex32(commitment)),
      );
    },
    async createCampaign(input) {
      await transact((c) =>
        c.callTx.createRecallCampaign(text32(input.id), encodeCampaign(input)),
      );
    },
    async closeCampaign(id) {
      await transact((c) => c.callTx.closeRecallCampaign(text32(id)));
    },
    async prove(id, credential) {
      await transact(
        (c) => c.callTx.proveRecallEligibility(text32(id)),
        encodeOpening(credential),
      );
    },
    async disconnect() {
      authority = undefined;
      await providers.privateStateProvider.clear();
      await providers.privateStateProvider.clearSigningKeys();
    },
  };
}
