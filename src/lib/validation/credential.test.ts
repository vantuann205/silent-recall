import {expect,it} from 'vitest';
import {createCredential,importCredential,credentialSchema,safeSummary} from './credential';
const input={manufacturerId:'ACME',modelId:'KETTLE-01',batchId:'BATCH-2026',serialNumber:'PRIVATE-SERIAL-123',purchaseDate:1780000000,warrantyEligible:true};
it('generates independent high entropy openings',()=>{const a=createCredential(input),b=createCredential(input);expect(a.productSecret).not.toBe(b.productSecret);expect(a.commitmentSalt).not.toBe(b.commitmentSalt);expect(credentialSchema.parse(a)).toEqual(a);});
it('round trips JSON locally',()=>{const c=createCredential(input);expect(importCredential(JSON.stringify(c))).toEqual(c);});
it.each(['{}','{broken','x'.repeat(16385)])('rejects malformed or oversized files without reflecting input',text=>expect(()=>importCredential(text)).toThrow('Invalid credential'));
it('rejects version, extra fields and impossible dates',()=>{const c=createCredential(input);for(const patch of [{credentialVersion:2},{leak:'extra'},{purchaseDate:-1},{productSecret:'short'},{issuedAt:1}])expect(()=>importCredential(JSON.stringify({...c,...patch}))).toThrow('Invalid credential');});
it('safe summary never includes opening or raw serial',()=>{const c=createCredential(input);const text=JSON.stringify(safeSummary(c));for(const secret of [c.serialNumber,c.productSecret,c.commitmentSalt])expect(text).not.toContain(secret);});
