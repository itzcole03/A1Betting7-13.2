import { FeatureEngineeringService } from '../FeatureEngineeringService';

describe('FeatureEngineeringService', () => {
  const config = {
    version: 'v1',
    features: { numerical: true, categorical: true, temporal: true },
  } as any;
  let nowSpy: jest.SpyInstance<number, []>;

  beforeAll(() => {
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1698547200000); // fixed timestamp
  });

  afterAll(() => {
    nowSpy.mockRestore();
  });

  it('engineers numerical, categorical and temporal features', async () => {
    const svc = new FeatureEngineeringService(config);
    const raw = [
      {
        id: 'p1',
        name: 'Player One',
        team: 'T1',
        position: 'G',
        stats: { pts: 20, reb: 5, ast: 7 },
      },
    ];

    const out = await svc.engineerFeatures(raw as any);

    expect(Array.isArray(out.numerical)).toBe(true);
    expect(out.numerical).toEqual(expect.arrayContaining([20, 5, 7]));
    expect(out.categorical).toEqual(expect.arrayContaining(['T1', 'G']));
    expect(out.metadata.version).toBe('v1');
    expect(typeof out.temporal[0]).toBe('number');
    expect(Number.isFinite(out.temporal[0])).toBe(true);
  });

  it('getMetrics returns expected keys', () => {
    const svc = new FeatureEngineeringService(config);
    const m = svc.getMetrics();
    expect(m).toHaveProperty('cacheHitRate');
    expect(m).toHaveProperty('processingTime');
    expect(m).toHaveProperty('featureCount');
  });
});
