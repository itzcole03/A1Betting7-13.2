jest.mock('../UnifiedMonitor', () => {
  const metrics: Array<{
    name: string;
    value: number;
    metadata?: Record<string, unknown>;
    labels: Record<string, string>;
    help?: string;
    type: 'counter' | 'gauge';
    count: number;
    sum: number;
    min: number;
    max: number;
    lastValue: number;
    lastUpdated: number;
    originalName: string;
  }> = [];

  class MockUnifiedMonitor {
    private static instance: MockUnifiedMonitor;

    static getInstance(): MockUnifiedMonitor {
      if (!MockUnifiedMonitor.instance) {
        MockUnifiedMonitor.instance = new MockUnifiedMonitor();
      }
      return MockUnifiedMonitor.instance;
    }

    recordMetric(name: string, value: number, metadata?: Record<string, unknown>) {
      metrics.push({
        name,
        value,
        metadata,
        labels: (metadata?.labels as Record<string, string>) ?? {},
        help: metadata?.help as string | undefined,
        type: (metadata?.type as 'counter' | 'gauge') ?? 'gauge',
        count: 1,
        sum: value,
        min: value,
        max: value,
        lastValue: value,
        lastUpdated: Date.now(),
        originalName: name,
      });
    }

    getMetricsSnapshot() {
      return metrics.map(metric => ({ ...metric }));
    }

    startTrace() {
      return 'mock-trace';
    }

    endTrace() {
      /* noop */
    }

    clearMetrics() {
      metrics.length = 0;
    }
  }

  return { UnifiedMonitor: MockUnifiedMonitor };
});

jest.mock('../../constants/sports', () => ({
  _SPORTS_CONFIG: [
    { id: 'MLB', season: { active: true } },
    { id: 'NFL', season: { active: false } },
  ],
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { masterServiceRegistry } from '../../services/MasterServiceRegistry';
import { MasterIntegrationProvider, useMasterIntegration } from '../MasterIntegrationHub';
import { UnifiedMonitor } from '../UnifiedMonitor';

describe('MasterIntegrationProvider', () => {
  beforeEach(() => {
    masterServiceRegistry.clear();
    UnifiedMonitor.getInstance().clearMetrics();
  });

  const Consumer: React.FC = () => {
    const ctx = useMasterIntegration();

    return (
      <div>
        <span data-testid='service-count'>{ctx.services.length}</span>
        <span data-testid='loading'>{ctx.loading ? 'yes' : 'no'}</span>
        <span data-testid='metrics-count'>{ctx.metrics.length}</span>
        <button type='button' onClick={() => ctx.recordCustomMetric('test_metric', 5, 'healthy')}>
          record
        </button>
      </div>
    );
  };

  it('provides a context with default snapshots', async () => {
    render(
      <MasterIntegrationProvider pollingIntervalMs={0}>
        <Consumer />
      </MasterIntegrationProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));

    expect(screen.getByTestId('service-count').textContent).toBe('0');
    expect(screen.getByTestId('metrics-count').textContent).not.toBe('');
  });

  it('captures registered service health after refresh', async () => {
    masterServiceRegistry.registerService('api', {});
    masterServiceRegistry.updateServiceHealth('api', 'healthy', 42);

    render(
      <MasterIntegrationProvider pollingIntervalMs={0}>
        <Consumer />
      </MasterIntegrationProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));

    expect(screen.getByTestId('service-count').textContent).toBe('1');
  });

  it('records custom metrics through the context helper', async () => {
    render(
      <MasterIntegrationProvider pollingIntervalMs={0}>
        <Consumer />
      </MasterIntegrationProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));

    const before = Number(screen.getByTestId('metrics-count').textContent || '0');
    fireEvent.click(screen.getByText('record'));

    await waitFor(() => {
      const after = Number(screen.getByTestId('metrics-count').textContent || '0');
      expect(after).toBeGreaterThanOrEqual(before);
    });
  });
});
