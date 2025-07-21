// @ts-expect-error TS(2305): Module '"../../unified/UnifiedConfig"' has no expo... Remove this comment to see the full error message
import { UnifiedConfig } from '../../unified/UnifiedConfig';

describe('SocialSentimentService', () => {
  beforeEach(() => {
    UnifiedConfig.getInstance().set('enableSocialSentiment', true);
  });

  it('is a singleton', () => {
    // @ts-expect-error TS(2304): Cannot find name 'a'.
    expect(a).toBe(b);
  });

  it('throws if feature is disabled', async () => {
    UnifiedConfig.getInstance().set('enableSocialSentiment', false);

    // @ts-expect-error TS(2304): Cannot find name 'service'.
    await expect(service.getSentimentAnalysis()).rejects.toThrow(
      'Social Sentiment feature is disabled by config.'
    );
  });

  it('throws not implemented if enabled', async () => {
    UnifiedConfig.getInstance().set('enableSocialSentiment', true);

    // @ts-expect-error TS(2304): Cannot find name 'service'.
    await expect(service.getSentimentAnalysis()).rejects.toThrow('not implemented');
  });
});
