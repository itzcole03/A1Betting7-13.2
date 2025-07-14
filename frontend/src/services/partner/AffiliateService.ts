export type AffiliateLink = { id: string; partnerName: string; url: string; active: boolean };
export type AffiliateOffer = { id: string; offer: string; active: boolean };

export const affiliateService = {
  async getAffiliateLinks(userId: string): Promise<AffiliateLink[]> {
    return [
      { id: '1', partnerName: 'PartnerA', url: 'https://a.com', active: true },
      { id: '2', partnerName: 'PartnerB', url: 'https://b.com', active: false },
    ];
  },
  async trackAffiliateClick(linkId: string, userId: string): Promise<void> {
    return;
  },
};
