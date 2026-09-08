import {bytesToHex} from '../validation/credential';
export {bytesToHex};
export function text32(text:string):Uint8Array{const bytes=new TextEncoder().encode(text);if(bytes.length>32)throw new Error('Value exceeds 32 encoded bytes.');const out=new Uint8Array(32);out.set(bytes);return out;}
export function hex32(text:string):Uint8Array{if(!/^[0-9a-f]{64}$/.test(text))throw new Error('Invalid 32-byte encoding.');return Uint8Array.from(text.match(/../g)!,b=>parseInt(b,16));}
export function decode32(bytes:Uint8Array){return new TextDecoder().decode(bytes).replace(/\0+$/,'');}
