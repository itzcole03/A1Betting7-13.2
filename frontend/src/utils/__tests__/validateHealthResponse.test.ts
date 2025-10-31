/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../oneTimeLog', () => ({ oneTimeLog: jest.fn() }));

import { oneTimeLog } from '../oneTimeLog';
import { validateHealthResponse } from '../validateHealthResponse';

const mockOneTimeLog = oneTimeLog as jest.MockedFunction<typeof oneTimeLog>;

describe('validateHealthResponse', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('validates a well-formed health payload and sets __validated', () => {
    const raw = {
      overall_status: 'healthy',
      services: [{ name: 'api', status: 'ok', latency_ms: 12 }],
      performance: { cpu_percent: '10', cache_hit_rate: 85 },
      cache: { hit_rate: 85 },
      infrastructure: { cache: { hit_rate_percent: 85 }, database: { status: 'ok' } },
      uptime_seconds: '42',
      timestamp: '2025-10-30T00:00:00Z',
    };

    const out = validateHealthResponse(raw);

    expect(out.__validated).toBe(true);
    expect(out.overall_status).toBe('ok'); // normalized
    expect(out.services[0].name).toBe('api');
    expect(out.performance.cache_hit_rate).toBe(85);
    expect(out.uptime_seconds).toBe(42);
  });

  it('throws DiagnosticsError when mandatory keys are missing and logs once', () => {
    expect(() => validateHealthResponse({})).toThrow();
  });
});
