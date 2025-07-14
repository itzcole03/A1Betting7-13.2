import { SocialSentimentService } from '@/SocialSentimentService';
import { UnifiedConfig } from '@/unified/UnifiedConfig';

describe('SocialSentimentService', () => {
  beforeEach(() => {
    UnifiedConfig.getInstance().set('enableSocialSentiment', true);
  });

  it('is a singleton', () => {
    expect(a).toBe(b);
  });

  it('throws if feature is disabled', async () => {
    UnifiedConfig.getInstance().set('enableSocialSentiment', false);

    await expect(service.getSentimentAnalysis()).rejects.toThrow(
      'Social Sentiment feature is disabled by config.'
    );
  });

  it('throws not implemented if enabled', async () => {
    UnifiedConfig.getInstance().set('enableSocialSentiment', true);

    await expect(service.getSentimentAnalysis()).rejects.toThrow('not implemented');
  });
});
