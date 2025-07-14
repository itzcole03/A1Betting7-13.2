import { getPvPMatchupFeatures } from '@/PvPMatchupModel';
import { UnifiedConfig } from '@/unified/UnifiedConfig';

describe('PvPMatchupModel', () => {
  beforeEach(() => {
    UnifiedConfig.getInstance().set('enablePvPModel', true);
  });

  it('extracts MLB features and SHAP', async () => {
    expect(result.sport).toBe('mlb');
    expect(typeof result.matchupScore).toBe('number');
    expect(result.features).toHaveProperty('mlb_k_rate_vs_pitcher');
    expect(Array.isArray(result.shapInsights)).toBe(true);
  });

  it('extracts NBA features and SHAP', async () => {
    expect(result.sport).toBe('nba');
    expect(typeof result.matchupScore).toBe('number');
    expect(result.features).toBeDefined();
    expect(Array.isArray(result.shapInsights)).toBe(true);
  });

  it('throws if model is disabled by config', async () => {
    UnifiedConfig.getInstance().set('enablePvPModel', false);
    await expect(getPvPMatchupFeatures('a', 'b', 'nba', Record<string, any>)).rejects.toThrow(
      'PvPMatchupModel is disabled by config.'
    );
  });

  it('throws for unsupported sport', async () => {
    await expect(
      getPvPMatchupFeatures('a', 'b', 'cricket' as any, Record<string, any>)
    ).rejects.toThrow('Unsupported sport type: cricket');
  });
});
