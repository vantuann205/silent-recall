import type { Campaign, CampaignInput } from '../validation/campaign';
import type { Credential } from '../validation/credential';
export interface PublicSnapshot {
  manufacturerId: string;
  initialized: boolean;
  authority: string;
  products: number;
  verifications: number;
  campaigns: Campaign[];
}
export interface RecallGateway {
  readonly mode: 'midnight' | 'demo';
  snapshot(): Promise<PublicSnapshot>;
  authorize(secret: string): Promise<void>;
  register(commitment: string): Promise<void>;
  createCampaign(campaign: CampaignInput): Promise<void>;
  closeCampaign(id: string): Promise<void>;
  prove(id: string, credential: Credential): Promise<void>;
  disconnect(): Promise<void>;
}
