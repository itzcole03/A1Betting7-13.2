import { z } from 'zod';

export const AffiliateLinkSchema = z.object({
  id: z.string(),
  partnerName: z.string(),
  url: z.string().url(),
  active: z.boolean(),
});

export const AffiliateOfferSchema = z.object({
  id: z.string(),
  partnerName: z.string(),
  description: z.string(),
  url: z.string().url(),
  validFrom: z.string(),
  validTo: z.string(),
  isActive: z.boolean(),
});

export type AffiliateLink = z.infer<typeof AffiliateLinkSchema>;
export type AffiliateOffer = z.infer<typeof AffiliateOfferSchema>;
