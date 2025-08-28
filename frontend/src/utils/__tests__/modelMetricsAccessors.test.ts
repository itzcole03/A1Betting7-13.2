import {
  getOptimizationLevel,
  getModelName,
  getProvider,
  getThroughputRps,
  getAvgLatencyMs,
  getP95LatencyMs,
  getSuccessRate,
  getTotalRequests,
  getTotalTokens,
  getTemperature,
  safeMetricsAccess,
  isNormalizedModelMetrics
} from '../modelMetricsAccessors';
import { oneTimeLog, clearLoggedSignatures } from '../oneTimeLog';

// Mock oneTimeLog to test warning calls
jest.mock('../oneTimeLog', () => {
  const loggedSignatures = new Set<string>();
  const logFnCalls: (() => void)[] = [];
  
  return {
    oneTimeLog: jest.fn((key: string, logFn: () => void, message?: string) => {
      const signature = `${key}:${message || 'generic'}`;
      if (!loggedSignatures.has(signature)) {
        loggedSignatures.add(signature);
        logFn();
        logFnCalls.push(logFn);
      }
    }),
    clearLoggedSignatures: jest.fn(() => {
      loggedSignatures.clear();
      logFnCalls.length = 0;
    }),
    getLogFnCallCount: () => logFnCalls.length,
  };
});

const mockOneTimeLog = oneTimeLog as jest.MockedFunction<any>;
const mockClearLoggedSignatures = clearLoggedSignatures as jest.MockedFunction<any>;

beforeEach(() => {
  mockOneTimeLog.mockClear();
  mockClearLoggedSignatures.mockClear();
  // Ensure we're in test environment for warnings
  process.env.NODE_ENV = 'test';
  clearLoggedSignatures();
});

describe('modelMetricsAccessors', () => {
  describe('getOptimizationLevel', () => {
    it('should get canonical optimization_level', () => {
      const canonical = {
        model: { optimization_level: 'Phase 4 Enhanced' }
      };
      
      expect(getOptimizationLevel(canonical)).toBe('Phase 4 Enhanced');
    });

    it('should fall back to legacy optimizationLevel', () => {
      const legacy = {
        optimizationLevel: 'Advanced'
      };
      
      const result = getOptimizationLevel(legacy);
      expect(result).toBe('Advanced');
      expect(mockOneTimeLog).toHaveBeenCalledWith(
        'optimization_level',
        expect.any(Function),
        'optimization_level'
      );
    });

    it('should try multiple legacy paths', () => {
      const legacyOptLevel = { opt_level: 'Phase 3' };
      expect(getOptimizationLevel(legacyOptLevel)).toBe('Phase 3');

      const legacySystemInfo = { system_info: { optimization_level: 'Phase 2' } };
      expect(getOptimizationLevel(legacySystemInfo)).toBe('Phase 2');
    });

    it('should return default for missing field', () => {
      expect(getOptimizationLevel({})).toBe('Basic');
      expect(getOptimizationLevel(null)).toBe('Basic');
    });
  });

  describe('getModelName', () => {
    it('should get canonical model name', () => {
      const canonical = {
        model: { name: 'GPT-4' }
      };
      
      expect(getModelName(canonical)).toBe('GPT-4');
    });

    it('should fall back to legacy modelName', () => {
      const legacy = { modelName: 'Legacy Model' };
      expect(getModelName(legacy)).toBe('Legacy Model');
    });

    it('should return default for missing field', () => {
      expect(getModelName({})).toBe('Unknown Model');
    });
  });

  describe('getProvider', () => {
    it('should get canonical provider', () => {
      const canonical = {
        model: { provider: 'OpenAI' }
      };
      
      expect(getProvider(canonical)).toBe('OpenAI');
    });

    it('should fall back to legacy provider', () => {
      const legacy = { provider: 'Legacy Provider' };
      expect(getProvider(legacy)).toBe('Legacy Provider');
    });
  });

  describe('performance metrics accessors', () => {
    it('should get throughput from canonical path', () => {
      const data = {
        performance: { throughput_rps: 123.45 }
      };
      
      expect(getThroughputRps(data)).toBe(123.45);
    });

    it('should get throughput from legacy path', () => {
      const legacy = { throughput: 100 };
      expect(getThroughputRps(legacy)).toBe(100);
    });

    it('should get latency metrics', () => {
      const data = {
        performance: {
          avg_latency_ms: 50.5,
          p95_latency_ms: 95.2
        }
      };
      
      expect(getAvgLatencyMs(data)).toBe(50.5);
      expect(getP95LatencyMs(data)).toBe(95.2);
    });

    it('should normalize success rate from percentage', () => {
      const percentageData = {
        performance: { success_rate: 85.5 }
      };
      
      // Should convert percentage to decimal
      expect(getSuccessRate(percentageData)).toBe(0.855);
    });

    it('should keep decimal success rate as-is', () => {
      const decimalData = {
        performance: { success_rate: 0.92 }
      };
      
      expect(getSuccessRate(decimalData)).toBe(0.92);
    });
  });

  describe('usage metrics accessors', () => {
    it('should get total requests from canonical path', () => {
      const data = {
        usage: { total_requests: 1000 }
      };
      
      expect(getTotalRequests(data)).toBe(1000);
    });

    it('should get total requests from legacy path', () => {
      const legacy = { total_inferences: 500 };
      expect(getTotalRequests(legacy)).toBe(500);
    });

    it('should get total tokens', () => {
      const data = {
        usage: { total_tokens: 750 }
      };
      
      expect(getTotalTokens(data)).toBe(750);
    });
  });

  describe('tuning parameters', () => {
    it('should get temperature from canonical path', () => {
      const data = {
        tuning: { temperature: 0.8 }
      };
      
      expect(getTemperature(data)).toBe(0.8);
    });

    it('should get temperature from legacy path', () => {
      const legacy = { temperature: 0.5 };
      expect(getTemperature(legacy)).toBe(0.5);
    });

    it('should return default temperature', () => {
      expect(getTemperature({})).toBe(0.7);
    });
  });

  describe('type coercion', () => {
    it('should coerce string numbers to numbers', () => {
      const stringData = {
        performance: {
          throughput_rps: '123.45',
          avg_latency_ms: '67'
        }
      };
      
      expect(getThroughputRps(stringData)).toBe(123.45);
      expect(getAvgLatencyMs(stringData)).toBe(67);
    });

    it('should coerce numbers to strings', () => {
      const numericData = {
        model: {
          name: 123,
          optimization_level: 456
        }
      };
      
      expect(getModelName(numericData)).toBe('123');
      expect(getOptimizationLevel(numericData)).toBe('456');
    });

    it('should handle invalid numeric strings', () => {
      const invalidData = {
        performance: {
          throughput_rps: 'not-a-number',
          avg_latency_ms: 'invalid'
        }
      };
      
      expect(getThroughputRps(invalidData)).toBe(0); // Default fallback
      expect(getAvgLatencyMs(invalidData)).toBe(0); // Default fallback
    });
  });

  describe('safeMetricsAccess utility', () => {
    it('should safely access nested properties', () => {
      const data = {
        deep: {
          nested: {
            value: 'found'
          }
        }
      };
      
      expect(safeMetricsAccess(data, ['deep', 'nested', 'value'], 'default')).toBe('found');
    });

    it('should return default for missing nested properties', () => {
      const data = { some: 'value' };
      
      expect(safeMetricsAccess(data, ['missing', 'nested', 'path'], 'fallback')).toBe('fallback');
    });

    it('should handle null/undefined objects', () => {
      expect(safeMetricsAccess(null, ['any', 'path'], 'default')).toBe('default');
      expect(safeMetricsAccess(undefined, ['any', 'path'], 'default')).toBe('default');
    });
  });

  describe('isNormalizedModelMetrics', () => {
    it('should identify normalized ModelMetricsShape', () => {
      const normalized = {
        model: { name: 'Test', provider: 'Test', optimization_level: 'Basic' },
        performance: { throughput_rps: 0, avg_latency_ms: 0, p95_latency_ms: 0, success_rate: 0 },
        usage: { total_requests: 0, input_tokens: 0, output_tokens: 0, total_tokens: 0 }
      };
      
      expect(isNormalizedModelMetrics(normalized)).toBe(true);
    });

    it('should reject incomplete objects', () => {
      const incomplete = {
        model: { name: 'Test' },
        // Missing performance and usage
      };
      
      expect(isNormalizedModelMetrics(incomplete)).toBe(false);
      expect(isNormalizedModelMetrics(null)).toBe(false);
      expect(isNormalizedModelMetrics({})).toBe(false);
    });
  });

  describe('one-time warning behavior', () => {
    it('should warn only once per field', () => {
      const legacyData = { optimizationLevel: 'Test' };
      
      // First access should call oneTimeLog
      getOptimizationLevel(legacyData);
      expect(mockOneTimeLog).toHaveBeenCalledTimes(1);
      
      // Second access should call oneTimeLog again but not log again
      getOptimizationLevel(legacyData);
      expect(mockOneTimeLog).toHaveBeenCalledTimes(2);
    });
  });
});