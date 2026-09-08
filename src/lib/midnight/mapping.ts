import {
  type Ledger,
  type RecallCampaign,
} from '../../../contract/generated/contract/index.js';
import { text32, decode32, bytesToHex } from '../crypto/encoding';
import { campaignSchema, type CampaignInput } from '../validation/campaign';
import type { PublicSnapshot } from './gateway';
export function encodeCampaign(input: CampaignInput): RecallCampaign {
  const c = campaignSchema.parse(input);
  return {
    title: c.title,
    manufacturer: text32(c.manufacturerId),
    model: text32(c.modelId),
    batch: text32(c.batchId),
    reason: c.reason,
    opensAt: BigInt(c.opensAt),
    expiresAt: BigInt(c.expiresAt),
    purchaseFrom: BigInt(c.purchaseFrom),
    purchaseTo: BigInt(c.purchaseTo),
    warrantyRequired: c.warrantyRequired,
    voucherValue: BigInt(c.voucherValue),
    active: true,
  };
}
export function publicSnapshot(state: Ledger): PublicSnapshot {
  return {
    manufacturerId: decode32(state.manufacturerId),
    initialized: state.initialized,
    authority: bytesToHex(state.authority),
    products: Number(state.productCount),
    verifications: Number(state.verificationCount),
    campaigns: Array.from(state.campaigns, ([id, c]) => ({
      id: decode32(id),
      title: c.title,
      manufacturerId: decode32(c.manufacturer),
      modelId: decode32(c.model),
      batchId: decode32(c.batch),
      reason: c.reason,
      opensAt: Number(c.opensAt),
      expiresAt: Number(c.expiresAt),
      purchaseFrom: Number(c.purchaseFrom),
      purchaseTo: Number(c.purchaseTo),
      warrantyRequired: c.warrantyRequired,
      voucherValue: Number(c.voucherValue),
      active: c.active,
    })),
  };
}
