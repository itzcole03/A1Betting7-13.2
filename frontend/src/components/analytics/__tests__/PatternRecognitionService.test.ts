import { PatternRecognitionService } from '@/services/analytics/PatternRecognitionService';
describe('PatternRecognitionService', () => {
  it('detects pattern structure', () => {
    const mockData = [
      /* mock input data */
    ];
    const result = PatternRecognitionService.detectPatterns(mockData);
    expect(result).toHaveProperty('inefficiencies');
    expect(result).toHaveProperty('streaks');
    expect(result).toHaveProperty('biases');
  });
});
