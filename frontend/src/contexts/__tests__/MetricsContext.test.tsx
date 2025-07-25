import { render } from '@testing-library/react';
import { _MetricsProvider, _useMetrics } from '../MetricsContext';

const TestComponent = () => {
  const ctx = _useMetrics();
  return <button onClick={() => ctx.track('test-event')}>Track</button>;
};

describe('MetricsContext', () => {
  it('provides default values and track function', () => {
    render(
      <_MetricsProvider>
        <TestComponent />
      </_MetricsProvider>
    );
    // No assertion: just ensure no crash and context is available
  });
});
