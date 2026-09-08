import {expect,it} from 'vitest';
import {ledger} from '../generated/contract/index.js';
import {authorityHarness,authoritySecret as secret} from './harness';
it('initializes only the deploy-bound manufacturer once',()=>{const h=authorityHarness();const next=h.contract.impureCircuits.initializeManufacturer(h.context).context;expect(ledger(next.currentQueryContext.state).initialized).toBe(true);expect(()=>h.contract.impureCircuits.initializeManufacturer(next)).toThrow('SR_DUPLICATE');});
it('rejects takeover before initialization',()=>{const h=authorityHarness();h.context.currentPrivateState={secret:new Uint8Array(32).fill(8)};expect(()=>h.contract.impureCircuits.initializeManufacturer(h.context)).toThrow('SR_UNAUTHORIZED');});
it('does not publish the authority secret',()=>{const h=authorityHarness();expect(ledger(h.context.currentQueryContext.state).authority).not.toEqual(secret);expect(Object.keys(ledger(h.context.currentQueryContext.state))).not.toContain('secret');});
