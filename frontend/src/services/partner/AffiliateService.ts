export type AffiliateLink = { id: string; partnerName: string; url: string; active: boolean };
export type AffiliateOffer = {
  id: string;
  partnerName: string;
  description: string;
  url: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
};
import { AffiliateLinkSchema, AffiliateOfferSchema } from '../../schemas/affiliate';

export const _affiliateService = {
  async getAffiliateLinks(userId: string): Promise<AffiliateLink[]> {
    const response = await fetch(`/api/affiliate-links?userId=${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch affiliate links: ${response.statusText}`);
    }
    const data = await response.json();
    const parsed = AffiliateLinkSchema.array().safeParse(data);
    if (!parsed.success) {
      throw new Error('Invalid affiliate links response');
    }
    return parsed.data;
  },
  async trackAffiliateClick(linkId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/affiliate-click`, {
      method: 'POST',
      body: JSON.stringify({ linkId, userId }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to track affiliate click: ${response.statusText}`);
    }
    return;
  },
  async getAffiliateOffers(): Promise<AffiliateOffer[]> {
    const response = await fetch(`/api/affiliate-offers`);
    if (!response.ok) {
      throw new Error(`Failed to fetch affiliate offers: ${response.statusText}`);
    }
    const data = await response.json();
    const parsed = AffiliateOfferSchema.array().safeParse(data);
    if (!parsed.success) {
      throw new Error('Invalid affiliate offers response');
    }
    return parsed.data;
  },
};
