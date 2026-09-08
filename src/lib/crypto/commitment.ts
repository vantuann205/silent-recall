import {
  pureCircuits,
  type ProductOpening,
} from '../../../contract/generated/contract/index.js';
import { credentialSchema, type Credential } from '../validation/credential';
import { text32, hex32, bytesToHex } from './encoding';
export function encodeOpening(value: Credential): ProductOpening {
  const c = credentialSchema.parse(value);
  return {
    manufacturer: text32(c.manufacturerId),
    model: text32(c.modelId),
    batch: text32(c.batchId),
    serial: text32(c.serialNumber),
    purchaseDate: BigInt(c.purchaseDate),
    warranty: c.warrantyEligible,
    secret: hex32(c.productSecret),
    salt: hex32(c.commitmentSalt),
  };
}
export function commitmentOf(credential: Credential) {
  return bytesToHex(pureCircuits.productCommitment(encodeOpening(credential)));
}
export function authorityOf(secret: string) {
  return bytesToHex(pureCircuits.authorityHash(hex32(secret)));
}
