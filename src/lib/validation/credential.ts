import {z} from 'zod';
export const identifier=z.string().regex(/^[A-Z0-9][A-Z0-9_-]{0,30}$/,'Use 1-31 uppercase letters, numbers, underscores or hyphens.');
export const timestamp=z.number().int().min(0).max(4102444800);
const secret=z.string().regex(/^[0-9a-f]{64}$/);
export const productSchema=z.strictObject({manufacturerId:identifier,modelId:identifier,batchId:identifier,serialNumber:z.string().min(4).max(31).regex(/^[\x21-\x7e]+$/),purchaseDate:timestamp,warrantyEligible:z.boolean()});
export const credentialSchema=productSchema.extend({credentialVersion:z.literal(1),productSecret:secret,commitmentSalt:secret,issuedAt:timestamp}).refine(c=>c.purchaseDate<=c.issuedAt,{message:'Purchase cannot be after issuance.'});
export type Credential=z.infer<typeof credentialSchema>;
export type ProductInput=z.infer<typeof productSchema>;
export const bytesToHex=(v:Uint8Array)=>Array.from(v,b=>b.toString(16).padStart(2,'0')).join('');
export function randomSecret(){return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));}
export function createCredential(input:ProductInput):Credential{return credentialSchema.parse({...productSchema.parse(input),credentialVersion:1,productSecret:randomSecret(),commitmentSalt:randomSecret(),issuedAt:Math.floor(Date.now()/1000)});}
export function importCredential(text:string):Credential{try{if(text.length>16384)throw new Error();return credentialSchema.parse(JSON.parse(text));}catch{throw new Error('Invalid credential. Check the file and credential version (v1).');}}
export function safeSummary(c:Credential){return {manufacturerId:c.manufacturerId,modelId:c.modelId,batchId:c.batchId,serial:'[private]',warrantyEligible:c.warrantyEligible};}
