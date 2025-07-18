﻿import { getRefereeImpactFeatures } from '@/RefereeImpactModel.js';
import { UnifiedConfig } from '@/unified/UnifiedConfig.js';

describe('RefereeImpactModel', () => {
  beforeAll(() => {
    UnifiedConfig.getInstance().set('enableRefereeImpactModel', { enabled: true });
  });

  it('returns valid features and score when enabled', async () => {
    expect(result).toHaveProperty('features');
    expect(result).toHaveProperty('shapInsights');
    expect(typeof result.refereeScore).toBe('number');
  });

  it('throws if model is disabled', async () => {
    UnifiedConfig.getInstance().set('enableRefereeImpactModel', { enabled: false });

    await expect(getRefereeImpactFeatures('ref1', 'basketball', context)).rejects.toThrow(
      'RefereeImpactModel is disabled by config.'
    );
    UnifiedConfig.getInstance().set('enableRefereeImpactModel', { enabled: true });
  });
});
