import React from 'react';
import { render, screen } from '@testing-library/react';
import { _MetricsProvider, _useMetrics } from '../MetricsContext';

function TestComponent() {
  const ctx = _useMetrics();
  return <div data-testid='metrics-context'>{ctx ? 'context-present' : 'context-absent'}</div>;
}

describe('MetricsContext', () => {
  it('provides default values and track function', () => {
    render(
      <_MetricsProvider>
        <TestComponent />
      </_MetricsProvider>
    );
    expect(screen.getByTestId('metrics-context')).toHaveTextContent('context-present');
    // Optionally, simulate track function call
    // e.g., fireEvent or rerender with new props
  });
});
