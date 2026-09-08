import { beforeEach, expect, it, vi } from 'vitest';
import { createConstructorContext } from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  pureCircuits,
} from '../../../contract/generated/contract/index.js';
import { memoryPrivateState, witnesses } from './private-state';
import { contractGateway, type Providers } from './contract-gateway';
import { text32, hex32 } from '../crypto/encoding';
import { createCredential } from '../validation/credential';
import { authorityOf } from '../crypto/commitment';
const mock = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock('@midnight-ntwrk/midnight-js-contracts', () => ({
  findDeployedContract: mock.find,
}));
const secret = '07'.repeat(32);
function setup() {
  const initial = new Contract(witnesses).initialState(
    createConstructorContext({}, '0'.repeat(64)),
    pureCircuits.authorityHash(hex32(secret)),
    text32('ACME'),
  );
  const store = memoryPrivateState();
  const query = vi.fn().mockResolvedValue(initial.currentContractState);
  const providers = {
    privateStateProvider: store,
    publicDataProvider: { queryContractState: query },
  } as unknown as Providers;
  const callTx = {
    initializeManufacturer: vi.fn().mockResolvedValue({}),
    registerProductCommitment: vi.fn().mockResolvedValue({}),
    createRecallCampaign: vi.fn().mockResolvedValue({}),
    closeRecallCampaign: vi.fn().mockResolvedValue({}),
    proveRecallEligibility: vi.fn().mockResolvedValue({}),
  };
  mock.find.mockResolvedValue({ callTx });
  return {
    g: contractGateway(providers, 'a'.repeat(64)),
    store,
    query,
    callTx,
  };
}
beforeEach(() => vi.clearAllMocks());
it('uses real contract public state and encodes all gateway calls', async () => {
  const { g, store, callTx } = setup();
  expect((await g.snapshot()).authority).toBe(authorityOf(secret));
  await expect(g.authorize('08'.repeat(32))).rejects.toThrow(
    'Manufacturer authorization',
  );
  await g.authorize(secret);
  expect(callTx.initializeManufacturer).toHaveBeenCalledOnce();
  await g.register('01'.repeat(32));
  await g.createCampaign({
    id: 'R1',
    title: 'Recall',
    manufacturerId: 'ACME',
    modelId: 'MODEL',
    batchId: 'BATCH',
    reason: 'Fire hazard',
    opensAt: 1,
    expiresAt: 200,
    purchaseFrom: 0,
    purchaseTo: 100,
    warrantyRequired: true,
    voucherValue: 0,
  });
  const c = createCredential({
    manufacturerId: 'ACME',
    modelId: 'MODEL',
    batchId: 'BATCH',
    serialNumber: 'PRIVATE-SERIAL',
    purchaseDate: 1,
    warrantyEligible: true,
  });
  await g.prove('R1', c);
  expect(callTx.proveRecallEligibility).toHaveBeenCalledWith(text32('R1'));
  expect(await store.get('silentRecall')).toBeNull();
  await g.closeCampaign('R1');
  expect(callTx.closeRecallCampaign).toHaveBeenCalledWith(text32('R1'));
  await g.disconnect();
  expect(await store.get('silentRecall')).toBeNull();
});
it('cleans witness state after failure and prevents overlapping transactions', async () => {
  const { g, store, callTx, query } = setup();
  let finish!: (value: object) => void;
  callTx.registerProductCommitment.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = g.register('01'.repeat(32));
  await vi.waitFor(() =>
    expect(callTx.registerProductCommitment).toHaveBeenCalledOnce(),
  );
  await expect(g.register('02'.repeat(32))).rejects.toThrow('unavailable');
  finish({});
  await pending;
  callTx.registerProductCommitment.mockRejectedValueOnce(
    new Error('SR_DUPLICATE'),
  );
  await expect(g.register('01'.repeat(32))).rejects.toThrow('SR_DUPLICATE');
  expect(await store.get('silentRecall')).toBeNull();
  query.mockResolvedValueOnce(null);
  await expect(g.snapshot()).rejects.toThrow('unavailable');
});
