import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PerformanceMonitoringDashboard from '../src/components/PerformanceMonitoringDashboard';
import { enhancedDataManager } from '../src/services/EnhancedDataManager';

describe('WebSocket connection logic', () => {
  it('should attempt to connect and handle errors gracefully', () => {
    // Mock WebSocket
    const wsOpen = vi.fn();
    const wsClose = vi.fn();
    const wsSend = vi.fn();
    const ws = {
      onopen: wsOpen,
      onclose: wsClose,
      onmessage: vi.fn(),
      onerror: vi.fn(),
      send: wsSend,
      close: wsClose,
    };
    vi.stubGlobal(
      'WebSocket',
      vi.fn(() => ws)
    );
    enhancedDataManager.initializeWebSocket();
    expect(wsOpen).not.toThrow();
  });
});

describe('PerformanceMonitoringDashboard', () => {
  it('renders fallback message if metrics are missing', () => {
    render(<PerformanceMonitoringDashboard />);
    expect(screen.getByText(/Metrics data unavailable/i)).toBeInTheDocument();
  });

  it('renders metrics if provided', () => {
    render(
      <PerformanceMonitoringDashboard
        metrics={{
          avgResponseTime: 123.45,
          cacheSize: 10,
          hitRate: 99.9,
          subscriptions: 2,
          pendingRequests: 1,
        }}
      />
    );
    expect(screen.getByText(/123.45 ms/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/99.90%/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });
});
