import { expect, it } from 'vitest';
import { authorityHarness } from './harness';
import { ledger } from '../generated/contract/index.js';
const id = new Uint8Array(32).fill(5);
export const recall = {
  title: 'Kettle safety',
  manufacturer: new Uint8Array(32).fill(1),
  model: new Uint8Array(32).fill(2),
  batch: new Uint8Array(32).fill(3),
  reason: 'Overheating',
  opensAt: 100n,
  expiresAt: 200n,
  purchaseFrom: 0n,
  purchaseTo: 100n,
  warrantyRequired: true,
  voucherValue: 50n,
  active: true,
};
it('creates unique campaigns and preserves history when closed', () => {
  const h = authorityHarness();
  let c = h.contract.impureCircuits.initializeManufacturer(h.context).context;
  c = h.contract.impureCircuits.createRecallCampaign(c, id, recall).context;
  expect(ledger(c.currentQueryContext.state).campaignCount).toBe(1n);
  expect(() =>
    h.contract.impureCircuits.createRecallCampaign(c, id, recall),
  ).toThrow('SR_DUPLICATE');
  c = h.contract.impureCircuits.closeRecallCampaign(c, id).context;
  expect(ledger(c.currentQueryContext.state).campaigns.lookup(id).title).toBe(
    recall.title,
  );
  expect(() => h.contract.impureCircuits.closeRecallCampaign(c, id)).toThrow(
    'SR_CLOSED',
  );
});
it.each([
  { expiresAt: 100n },
  { purchaseFrom: 101n },
  { active: false },
  { voucherValue: 1000001n },
])('rejects invalid campaign state %o', (patch) => {
  const h = authorityHarness();
  const c = h.contract.impureCircuits.initializeManufacturer(h.context).context;
  expect(() =>
    h.contract.impureCircuits.createRecallCampaign(c, id, {
      ...recall,
      ...patch,
    }),
  ).toThrow('SR_INVALID');
});
it('rejects unauthorized lifecycle calls', () => {
  const h = authorityHarness();
  let c = h.contract.impureCircuits.initializeManufacturer(h.context).context;
  c = h.contract.impureCircuits.createRecallCampaign(c, id, recall).context;
  c.currentPrivateState.secret = new Uint8Array(32).fill(8);
  expect(() => h.contract.impureCircuits.closeRecallCampaign(c, id)).toThrow(
    'SR_UNAUTHORIZED',
  );
  expect(() =>
    h.contract.impureCircuits.createRecallCampaign(c, id, recall),
  ).toThrow('SR_UNAUTHORIZED');
});
