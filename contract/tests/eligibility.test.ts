import { expect, it } from 'vitest';
import { authorityHarness, openingFixture } from './harness';
import {
  ledger,
  pureCircuits,
  type ProductOpening,
} from '../generated/contract/index.js';
const id = new Uint8Array(32).fill(5);
const recall = {
  title: 'Kettle safety',
  manufacturer: openingFixture.manufacturer,
  model: openingFixture.model,
  batch: openingFixture.batch,
  reason: 'Overheating',
  opensAt: 100n,
  expiresAt: 200n,
  purchaseFrom: 0n,
  purchaseTo: 100n,
  warrantyRequired: true,
  voucherValue: 50n,
  active: true,
};
function eligible(
  patch: Partial<ProductOpening> = {},
  time = 150n,
  registered = openingFixture,
) {
  const h = authorityHarness();
  let c = h.contract.impureCircuits.initializeManufacturer(h.context).context;
  c = h.contract.impureCircuits.registerProductCommitment(
    c,
    pureCircuits.productCommitment(registered),
  ).context;
  c = h.contract.impureCircuits.createRecallCampaign(c, id, recall).context;
  c.currentPrivateState.opening = { ...openingFixture, ...patch };
  c.currentQueryContext.block = {
    ...c.currentQueryContext.block,
    secondsSinceEpoch: time,
  };
  return { ...h, context: c };
}
it('valid opening passes compiled circuit and only increments aggregate', () => {
  const h = eligible();
  const c = h.contract.impureCircuits.proveRecallEligibility(
    h.context,
    id,
  ).context;
  expect(ledger(c.currentQueryContext.state).verificationCount).toBe(1n);
  expect(Object.keys(ledger(c.currentQueryContext.state))).not.toContain(
    'serial',
  );
});
it.each([
  ['manufacturer', 'SR_MANUFACTURER'],
  ['model', 'SR_MODEL'],
  ['batch', 'SR_BATCH'],
  ['serial', 'SR_UNREGISTERED'],
  ['salt', 'SR_UNREGISTERED'],
  ['secret', 'SR_UNREGISTERED'],
] as const)('rejects wrong %s', (field, code) => {
  const h = eligible({ [field]: new Uint8Array(32).fill(99) });
  expect(() =>
    h.contract.impureCircuits.proveRecallEligibility(h.context, id),
  ).toThrow(code);
});
it('rejects invalid warranty and purchase date', () => {
  for (const [patch, code] of [
    [{ warranty: false }, 'SR_WARRANTY'],
    [{ purchaseDate: 101n }, 'SR_PURCHASE'],
  ] as const) {
    const h = eligible(patch);
    expect(() =>
      h.contract.impureCircuits.proveRecallEligibility(h.context, id),
    ).toThrow(code);
  }
});
it.each([0n, 100n])(
  'accepts registered purchase boundary %s',
  (purchaseDate) => {
    const h = eligible({ purchaseDate }, 150n, {
      ...openingFixture,
      purchaseDate,
    });
    expect(() =>
      h.contract.impureCircuits.proveRecallEligibility(h.context, id),
    ).not.toThrow();
  },
);
it.each([
  [99n, 'SR_SCHEDULED'],
  [200n, 'SR_EXPIRED'],
  [201n, 'SR_EXPIRED'],
] as const)('enforces real ledger clock %s', (time, code) => {
  const h = eligible({}, time);
  expect(() =>
    h.contract.impureCircuits.proveRecallEligibility(h.context, id),
  ).toThrow(code);
});
it('accepts exact opening boundary', () => {
  const h = eligible({}, 100n);
  expect(() =>
    h.contract.impureCircuits.proveRecallEligibility(h.context, id),
  ).not.toThrow();
});
it('rejects a closed campaign', () => {
  const h = eligible();
  const c = h.contract.impureCircuits.closeRecallCampaign(
    h.context,
    id,
  ).context;
  expect(() => h.contract.impureCircuits.proveRecallEligibility(c, id)).toThrow(
    'SR_CLOSED',
  );
});
