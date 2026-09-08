import {expect,it} from 'vitest';
import {bytesToHex,text32,hex32,decode32} from './encoding';
it('encodes text by UTF-8 byte length, without truncation',()=>{expect(decode32(text32('BATCH-A'))).toBe('BATCH-A');expect(text32('x')).toHaveLength(32);expect(()=>text32('é'.repeat(17))).toThrow();});
it('round trips 256-bit values exactly',()=>{const hex='ab'.repeat(32);expect(bytesToHex(hex32(hex))).toBe(hex);expect(()=>hex32('zz'.repeat(32))).toThrow();});
