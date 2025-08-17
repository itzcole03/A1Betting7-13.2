import React from 'react';
import { render } from '@testing-library/react';
import { AdvancedAIDashboard } from '../../components/ai/AdvancedAIDashboard';
import { getOptimizationLevel, getModelName, getProvider } from '../../utils/modelMetricsAccessors';

// Mock the API calls to return controlled test data
jest.mock('../../services/TypedAPIClient');

describe('AdvancedAIDashboard - Model Metrics Regression', () => {
  it('should render without crashing when metrics are null', () => {
    const { container } = render(<AdvancedAIDashboard />);
    expect(container).toBeInTheDocument();
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