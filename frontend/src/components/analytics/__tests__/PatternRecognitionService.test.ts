// @ts-expect-error TS(2307): Cannot find module '@/services/analytics/PatternRe... Remove this comment to see the full error message
import { PatternRecognitionService } from '@/services/analytics/PatternRecognitionService';
describe('PatternRecognitionService', () => {
  it('detects pattern structure', () => {
    const mockData: any = [
      /* mock input data */
    ];
    const result = PatternRecognitionService.detectPatterns(mockData);
    expect(result).toHaveProperty('inefficiencies');
    expect(result).toHaveProperty('streaks');
    expect(result).toHaveProperty('biases');
  });
});
