import { ShapExplainerService } from '@/services/analytics/ShapExplainerService';
describe('ShapExplainerService', () => {
  it('returns feature importances', async () => {
    const mockData = { features: [1, 2, 3], values: [0.5, 0.3, 0.2] };
    const result = await ShapExplainerService.explain(mockData);
    expect(result.featureImportances).toBeDefined();
    expect(Array.isArray(result.featureImportances)).toBe(true);
  });
});
