/* eslint-disable @typescript-eslint/no-var-requires */
// Focused tests for ensureHealthShape (validated path + fallback)
jest.mock('../validateHealthResponse', () => ({ validateHealthResponse: jest.fn() }));
jest.mock('../oneTimeLog', () => ({ oneTimeLog: jest.fn() }));

import { ensureHealthShape } from '../ensureHealthShape';
import { oneTimeLog } from '../oneTimeLog';
import { validateHealthResponse } from '../validateHealthResponse';

const mockValidate = validateHealthResponse as jest.MockedFunction<typeof validateHealthResponse>;
const mockOneTimeLog = oneTimeLog as jest.MockedFunction<typeof oneTimeLog>;

describe('ensureHealthShape (focused)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('maps a validated modern shape into SystemHealth', () => {
    const validated = {
      overall_status: 'ok',
      services: [{ name: 'api', status: 'ok' }],
      infrastructure: {
        cache: { status: 'ok', hit_rate_percent: 85 },
        database: { status: 'degraded' },
      },
      performance: { cache_hit_rate: 0.85 },
      uptime_seconds: '123',
      cache: { dummy: true },
    } as unknown;

    mockValidate.mockImplementation(() => validated as any);

    const out = ensureHealthShape(validated);

    expect(out.status).toBe('healthy');
    expect(out.services.api).toBe('healthy');
    expect(out.services.cache).toBe('healthy');
    expect(out.services.database).toBe('degraded');
    expect(out.performance.cache_hit_rate).toBeCloseTo(0.85);
    expect(out.uptime_seconds).toBe(123);
    expect(out.originFlags?.hadCacheHitRate).toBe(true);
    expect(out.originFlags?.usedMock).toBe(false);
    expect(mockOneTimeLog).toHaveBeenCalled();
  });

  it('falls back to tolerant parsing when validation throws', () => {
    mockValidate.mockImplementation(() => {
      throw new Error('boom');
    });

    const raw = {
      status: true,
      services: { api: false, cache: 'healthy', database: 'down' },
      performance: { hit_rate: '42' },
      uptime_seconds: '30',
    } as unknown;

    const out = ensureHealthShape(raw);

    expect(out.status).toBe('healthy');
    expect(out.services.api).toBe('unhealthy');
    expect(out.services.cache).toBe('healthy');
    expect(out.services.database).toBe('unhealthy');
    expect(out.performance.cache_hit_rate).toBe(42);
    expect(out.uptime_seconds).toBe(30);
    expect(out.originFlags?.usedMock).toBe(true);
    expect(mockOneTimeLog).toHaveBeenCalled();
  });
});
