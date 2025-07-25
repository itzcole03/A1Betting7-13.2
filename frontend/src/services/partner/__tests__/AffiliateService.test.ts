/**
 * @fileoverview
 * Unit tests for the AffiliateService module.
 *
 * This suite verifies:
 *  - Fetching affiliate links (success and failure)
 *  - Tracking affiliate clicks (success and failure)
 *  - Fetching affiliate offers (success and failure)
 *
 * All network requests are mocked using Jest's global.fetch.
 */
import { _affiliateService as affiliateService } from '../AffiliateService';

describe('AffiliateService', () => {
  beforeAll(() => {
    // Override global.fetch for this test suite
    global.fetch = jest.fn();
  });
  /**
   * Reset all fetch mocks before each test to ensure isolation.
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Should fetch affiliate links for a user and return the expected array.
   */
  it('fetches affiliate links', async () => {
    const _mockLinks = [
      { id: '1', partnerName: 'PartnerA', url: 'https://a.com', active: true },
      { id: '2', partnerName: 'PartnerB', url: 'https://b.com', active: false },
    ];
    // Ensure the mock matches the Zod schema exactly
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(_mockLinks) })
    );

    const result = await affiliateService.getAffiliateLinks('test-user-id');
    expect(result).toEqual(_mockLinks);
    expect(fetch).toHaveBeenCalled();
  });

  /**
   * Should throw an error if the affiliate links fetch fails.
   */
  it('throws on affiliate links fetch failure', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: false, statusText: 'Not Found' })
    );
    const _userId = 'test-user-id';
    await expect(affiliateService.getAffiliateLinks(_userId)).rejects.toThrow(
      'Failed to fetch affiliate links: Not Found'
    );
  });

  /**
   * Should track an affiliate link click for a user.
   */
  it('tracks affiliate click', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    const _linkId = 'test-link-id';
    const _userId = 'test-user-id';
    await expect(affiliateService.trackAffiliateClick(_linkId, _userId)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalled();
  });

  /**
   * Should throw an error if tracking an affiliate click fails.
   */
  it('throws on affiliate click track failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Bad Request' });
    const _linkId = 'test-link-id';
    const _userId = 'test-user-id';
    await expect(affiliateService.trackAffiliateClick(_linkId, _userId)).rejects.toThrow(
      'Failed to track affiliate click: Bad Request'
    );
  });

  /**
   * Should fetch affiliate offers and return the expected array.
   */
  it('fetches affiliate offers', async () => {
    const _mockOffers = [
      {
        id: '1',
        partnerName: 'PartnerA',
        description: 'Offer1',
        url: 'https://a.com',
        validFrom: '2025-01-01',
        validTo: '2025-12-31',
        isActive: true,
      },
    ];
    // Ensure the mock matches the Zod schema exactly
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(_mockOffers) })
    );

    const result = await affiliateService.getAffiliateOffers();
    expect(result).toEqual(_mockOffers);
    expect(fetch).toHaveBeenCalled();
  });

  /**
   * Should throw an error if the affiliate offers fetch fails.
   */
  it('throws on affiliate offers fetch failure', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: false, statusText: 'Server Error' })
    );
    await expect(affiliateService.getAffiliateOffers()).rejects.toThrow(
      'Failed to fetch affiliate offers: Server Error'
    );
  });
});
