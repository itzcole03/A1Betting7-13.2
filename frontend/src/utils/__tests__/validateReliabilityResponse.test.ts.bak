jest.mock('../oneTimeLog', () => ({ oneTimeLog: jest.fn() }));

import { oneTimeLog } from '../oneTimeLog';
import { validateReliabilityResponse } from '../validateReliabilityResponse';

const mockOneTimeLog = oneTimeLog as jest.MockedFunction<typeof oneTimeLog>;

describe('validateReliabilityResponse', () => {
  beforeEach(() => jest.resetAllMocks());

  it('validates a minimal reliability payload with anomalies and marks __validated', () => {
    const raw = {
      overall_status: 'ok',
      anomalies: [{ code: 'A1', severity: 'critical', message: 'boom' }],
      timestamp: '2025-10-30T00:00:00Z',
    };

    const out = validateReliabilityResponse(raw);
    expect(out.__validated).toBe(true);
    expect(out.overall_status).toBe('ok');
    expect(Array.isArray(out.anomalies)).toBe(true);
    expect(out.anomalies[0].severity).toBe('critical');
  });

  it('throws when mandatory keys missing and logs', () => {
    expect(() => validateReliabilityResponse({})).toThrow();
    expect(mockOneTimeLog).toHaveBeenCalled();
  });
});
