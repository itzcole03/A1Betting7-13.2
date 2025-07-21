// @ts-expect-error TS(2307): Cannot find module '@/../services/integrations/liv... Remove this comment to see the full error message
import { logLiveData } from '@/../services/integrations/liveDataLogger';
describe('Analytics Logging', () => {
  it('logs data without throwing', () => {
    expect(() => logLiveData('test log')).not.toThrow();
  });
});
