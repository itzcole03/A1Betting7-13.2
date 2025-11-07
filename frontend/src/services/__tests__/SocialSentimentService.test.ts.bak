import { UnifiedConfig } from '../../core/UnifiedConfig';
import { SocialSentimentService } from '../SocialSentimentService';

describe('SocialSentimentService', () => {
  beforeEach(() => {
    UnifiedConfig.getInstance().set('enableSocialSentiment', true);
  });

  it('is a singleton', () => {
    const _service1 = SocialSentimentService.getInstance();
    const _service2 = SocialSentimentService.getInstance();
    expect(_service1).toBe(_service2);
  });

  it('throws if feature is disabled', async () => {
    UnifiedConfig.getInstance().set('enableSocialSentiment', false);

    const _service = SocialSentimentService.getInstance();
    await expect(_service.getSentimentAnalysis()).rejects.toThrow(
      'Social Sentiment feature is disabled by config.'
    );
  });

  it('throws not implemented if enabled', async () => {
    UnifiedConfig.getInstance().set('enableSocialSentiment', true);

    const _service = SocialSentimentService.getInstance();
    await expect(_service.getSentimentAnalysis()).rejects.toThrow('not implemented');
  });
});
