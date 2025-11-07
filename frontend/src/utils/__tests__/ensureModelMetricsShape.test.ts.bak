import { ensureModelMetricsShape } from '../ensureModelMetricsShape';

describe('ensureModelMetricsShape', () => {
  it('should handle empty object with full defaults', () => {
    const result = ensureModelMetricsShape({});
    
    expect(result).toEqual({
      model: {
        name: 'Unknown Model',
        provider: 'Unknown Provider', 
        optimization_level: 'Basic'
      },
      performance: {
        throughput_rps: 0,
        avg_latency_ms: 0,
        p95_latency_ms: 0,
        success_rate: 0
      },
      usage: {
        total_requests: 0,
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0
      },
      originFlags: {
        partialPayload: true
      }
    });
  });

  it('should map legacy optimization_level fields', () => {
    const legacyData = {
      optimizationLevel: 'Advanced',
      opt_level: 'Phase 3',
      modelName: 'Test Model',
      provider: 'OpenAI',
      system_info: {
        optimization_level: 'Phase 4 Enhanced'
      }
    };

    const result = ensureModelMetricsShape(legacyData);
    
    // Should use first found value (optimizationLevel)
    expect(result.model.optimization_level).toBe('Advanced');
    expect(result.model.name).toBe('Test Model');
    expect(result.model.provider).toBe('OpenAI');
    expect(result.originFlags?.mappedLegacy).toBe(true);
  });

  it('should prefer canonical structure over legacy', () => {
    const mixedData = {
      model: {
        name: 'Canonical Model',
        provider: 'Canonical Provider',
        optimization_level: 'Canonical Level'
      },
      // Legacy fields should be ignored
      modelName: 'Legacy Model',
      provider: 'Legacy Provider',
      optimizationLevel: 'Legacy Level',
      performance: {
        throughput_rps: 100,
        avg_latency_ms: 50
      }
    };

    const result = ensureModelMetricsShape(mixedData);
    
    expect(result.model.name).toBe('Canonical Model');
    expect(result.model.provider).toBe('Canonical Provider');
    expect(result.model.optimization_level).toBe('Canonical Level');
    expect(result.performance.throughput_rps).toBe(100);
    expect(result.originFlags?.mappedLegacy).toBeFalsy();
  });

  it('should coerce string numbers to numbers', () => {
    const stringData = {
      model: {
        name: 'String Model',
        provider: 'Test',
        optimization_level: 'Basic'
      },
      performance: {
        throughput_rps: '123.45',
        avg_latency_ms: '67.89',
        success_rate: '0.95'
      },
      usage: {
        total_requests: '1000',
        input_tokens: '500',
        output_tokens: '300'
      }
    };

    const result = ensureModelMetricsShape(stringData);
    
    expect(result.performance.throughput_rps).toBe(123.45);
    expect(result.performance.avg_latency_ms).toBe(67.89);
    expect(result.performance.success_rate).toBe(0.95);
    expect(result.usage.total_requests).toBe(1000);
    expect(result.usage.total_tokens).toBe(800); // Derived sum
  });

  it('should mark partial payload when sections missing', () => {
    const partialData = {
      model: {
        name: 'Partial Model',
        optimization_level: 'Basic'
      },
      // Missing performance and usage sections
      some_other_field: 'value'
    };

    const result = ensureModelMetricsShape(partialData);
    
    expect(result.originFlags?.partialPayload).toBe(true);
    // Should still have safe defaults for missing sections
    expect(result.performance.throughput_rps).toBe(0);
    expect(result.usage.total_requests).toBe(0);
  });

  it('should handle multiple legacy optimization variants', () => {
    const legacyData = {
      opt_level: 'Phase 2',
      optimization_mode: 'Fast', 
      optimizationTier: 'High',
      modelName: 'Multi-Legacy Model'
    };

    const result = ensureModelMetricsShape(legacyData);
    
    // Should use first match in legacy path order
    expect(result.model.optimization_level).toBe('Phase 2');
    expect(result.model.name).toBe('Multi-Legacy Model');
    expect(result.originFlags?.mappedLegacy).toBe(true);
  });

  it('should derive total_tokens from input + output', () => {
    const tokenData = {
      model: { name: 'Token Model', provider: 'Test', optimization_level: 'Basic' },
      performance: { throughput_rps: 10, avg_latency_ms: 100, p95_latency_ms: 200, success_rate: 0.9 },
      usage: {
        total_requests: 100,
        input_tokens: 150,
        output_tokens: 75,
        // total_tokens missing - should be derived
      }
    };

    const result = ensureModelMetricsShape(tokenData);
    
    expect(result.usage.total_tokens).toBe(225); // 150 + 75
  });

  it('should derive success_rate from success_requests/total_requests', () => {
    const successData = {
      model: { name: 'Success Model', provider: 'Test', optimization_level: 'Basic' },
      performance: { throughput_rps: 10, avg_latency_ms: 100, p95_latency_ms: 200 },
      // Missing success_rate in performance section
      success_requests: 85,
      total_requests: 100,
      usage: { total_requests: 100, input_tokens: 0, output_tokens: 0, total_tokens: 0 }
    };

    const result = ensureModelMetricsShape(successData);
    
    expect(result.performance.success_rate).toBe(0.85);
    expect(result.originFlags?.mappedLegacy).toBe(true);
  });

  it('should handle null input gracefully', () => {
    const result = ensureModelMetricsShape(null);
    
    expect(result.model.name).toBe('Unknown Model');
    expect(result.model.optimization_level).toBe('Basic');
    expect(result.originFlags?.partialPayload).toBe(true);
  });

  it('should handle non-object input gracefully', () => {
    const result = ensureModelMetricsShape('invalid input');
    
    expect(result.model.name).toBe('Unknown Model');
    expect(result.performance.throughput_rps).toBe(0);
    expect(result.usage.total_requests).toBe(0);
  });
});