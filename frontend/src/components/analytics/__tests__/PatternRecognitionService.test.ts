import { PatternRecognitionService } from '../../../services/analytics/PatternRecognitionService';
describe('PatternRecognitionService', () => {
  it('detects pattern structure', () => {
    const _mockData: unknown[] = [
      // mock input data
    ];
    const _result = PatternRecognitionService.analyzeMarketPatterns(_mockData as any);
    expect(_result).toHaveProperty('inefficiencies');
    expect(_result).toHaveProperty('streaks');
    expect(_result).toHaveProperty('biases');
  });
});
