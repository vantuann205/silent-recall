import { z } from 'zod';
import { identifier, timestamp } from './credential';
export const campaignSchema = z
  .strictObject({
    id: identifier,
    title: z.string().trim().min(3).max(100),
    manufacturerId: identifier,
    modelId: identifier,
    batchId: identifier,
    reason: z.string().trim().min(5).max(280),
    opensAt: timestamp,
    expiresAt: timestamp,
    purchaseFrom: timestamp,
    purchaseTo: timestamp,
    warrantyRequired: z.boolean(),
    voucherValue: z.number().int().min(0).max(1000000),
  })
  .refine((c) => c.opensAt < c.expiresAt, {
    message: 'Expiration must be after opening.',
    path: ['expiresAt'],
  })
  .refine((c) => c.purchaseFrom <= c.purchaseTo, {
    message: 'Purchase range is reversed.',
    path: ['purchaseTo'],
  });
export type CampaignInput = z.infer<typeof campaignSchema>;
export type Campaign = CampaignInput & { active: boolean };
export function campaignStatus(
  c: Campaign,
  now = Math.floor(Date.now() / 1000),
) {
  return !c.active
    ? 'Closed'
    : now < c.opensAt
      ? 'Scheduled'
      : now >= c.expiresAt
        ? 'Expired'
        : 'Active';
}
export function dateSeconds(value: string) {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error('Invalid date.');
  return Math.floor(ms / 1000);
}
