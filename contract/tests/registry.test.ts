import { expect, it } from 'vitest';
import { authorityHarness } from './harness';
import { ledger } from '../generated/contract/index.js';
const commitment = new Uint8Array(32).fill(42);
it('registers only a commitment and increments exactly once', () => {
  const h = authorityHarness();
  const c = h.contract.impureCircuits.initializeManufacturer(h.context).context;
  const next = h.contract.impureCircuits.registerProductCommitment(
    c,
    commitment,
  ).context;
  expect(ledger(next.currentQueryContext.state).productCount).toBe(1n);
  expect(() =>
    h.contract.impureCircuits.registerProductCommitment(next, commitment),
  ).toThrow('SR_DUPLICATE');
});
it('rejects unauthorized or zero registrations', () => {
  const h = authorityHarness();
  const c = h.contract.impureCircuits.initializeManufacturer(h.context).context;
  expect(() =>
    h.contract.impureCircuits.registerProductCommitment(c, new Uint8Array(32)),
  ).toThrow('SR_INVALID');
  c.currentPrivateState.secret = new Uint8Array(32).fill(9);
  expect(() =>
    h.contract.impureCircuits.registerProductCommitment(c, commitment),
  ).toThrow('SR_UNAUTHORIZED');
});
