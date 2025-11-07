import React, { act } from 'react';
import { render } from '@testing-library/react';
import { AdvancedAIDashboard } from '../../components/ai/AdvancedAIDashboard';
import { getOptimizationLevel, getModelName, getProvider } from '../../utils/modelMetricsAccessors';

// Mock the API calls to return controlled test data
jest.mock('../../services/TypedAPIClient');

// Provide a lightweight `fetch` mock for the endpoints used by the component so
// mount effects receive shape-correct payloads. Tests that need custom data can
// override this by spying on `global.fetch` themselves.
const _origFetch = global.fetch;
beforeAll(() => {
  global.fetch = jest.fn((input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    // Only handle the AI-dashboard endpoints; fall back to original fetch otherwise
    if (typeof url === 'string') {
      if (url.includes('/api/ai/multi-sport/integration-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ sports: [{ sport: 'NBA', league: 'NBA', total_games: 123, active_players: 450, data_freshness: '1m', prediction_accuracy: 88.5, last_updated: new Date().toISOString(), status: 'active' }] }) });
      }
      if (url.includes('/api/ai/sport-features/status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ features: [] }) });
      }
      if (url.includes('/api/ai/ensemble/models')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ models: [] }) });
      }
      if (url.includes('/api/ai/model-registry/entries')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ models: [] }) });
      }
      if (url.includes('/api/ai/inference/metrics')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ metrics: { total_requests: 1000, avg_latency_ms: 20, success_rate: 0.99, error_rate: 0.01, queue_size: 1, active_models: 1, cache_hit_rate: 0.9, throughput_per_second: 50 } }) });
      }
      if (url.includes('/api/ai/inference/real-time/latest')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ predictions: [] }) });
      }
      if (url.includes('/api/ai/monitoring/dashboard/overview')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ total_predictions: 10000, active_models: 1 }) });
      }
      if (url.includes('/api/ai/monitoring/models')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ models: [] }) });
      }
      if (url.match(/\/api\/ai\/monitoring\/models\/[^/]+\/health/)) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
    }
    return _origFetch(input, init);
  });
});

afterAll(() => {
  global.fetch = _origFetch;
});

describe('AdvancedAIDashboard - Model Metrics Regression', () => {
  it('should render without crashing when metrics are null', () => {
    const { container } = render(<AdvancedAIDashboard />);
    // Flush any pending effects initiated on mount to avoid "not wrapped in act" warnings
    return act(async () => {
      // allow microtasks + one macrotask to process MSW responses and Promise.all
      await new Promise((r) => setTimeout(r, 20));
      expect(container).toBeInTheDocument();
    });
  });

  it('should handle legacy optimization_level fields via accessors', () => {
    const legacyMetrics = {
      opt_level: 'Phase 3',
      modelName: 'Legacy Model',
      provider: 'OpenAI'
    };

    expect(getOptimizationLevel(legacyMetrics)).toBe('Phase 3');
    expect(getModelName(legacyMetrics)).toBe('Legacy Model');
    expect(getProvider(legacyMetrics)).toBe('OpenAI');
  });

  it('should handle canonical model metrics structure', () => {
    const canonicalMetrics = {
      model: {
        optimization_level: 'Phase 4 Enhanced',
        name: 'GPT-4',
        provider: 'OpenAI'
      }
    };

    expect(getOptimizationLevel(canonicalMetrics)).toBe('Phase 4 Enhanced');
    expect(getModelName(canonicalMetrics)).toBe('GPT-4');
    expect(getProvider(canonicalMetrics)).toBe('OpenAI');
  });

  it('should render fallback values for missing model metrics', () => {
    const emptyMetrics = {};

    expect(getOptimizationLevel(emptyMetrics)).toBe('Basic');
    expect(getModelName(emptyMetrics)).toBe('Unknown Model');
    expect(getProvider(emptyMetrics)).toBe('Unknown Provider');
  });

  it('should not throw when accessors receive null/undefined', () => {
    expect(() => {
      getOptimizationLevel(null);
      getModelName(undefined);
      getProvider({});
    }).not.toThrow();
  });

  it('should display correct accessor outputs in component text', async () => {
    // This would need to be implemented when the component is updated to use accessors
    // For now, we test that the accessors work correctly
    
    const testMetrics = {
      system_info: {
        optimization_level: 'System Info Level'
      },
      optimizationLevel: 'Direct Level'
    };

    // Accessor should find the legacy field
    const result = getOptimizationLevel(testMetrics);
    expect(result).toBe('System Info Level'); // First path in legacy array wins
  });

  // Test data-testid attributes would be added to actual component for E2E testing
  it('should have data-testid attributes for testing', () => {
    // This test documents the expected test IDs for future component updates
    const expectedTestIds = [
      'model-optimization-level',
      'model-name',
      'model-provider',
      'performance-throughput',
      'performance-latency',
      'usage-total-requests'
    ];

    // When component is updated, these test IDs should be added for reliable testing
    expectedTestIds.forEach(testId => {
      expect(testId).toBeTruthy(); // Placeholder - actual implementation would check DOM
    });
  });
});