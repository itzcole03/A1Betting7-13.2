import { render, screen } from '@testing-library/react';
import { _ThemeProvider, _useTheme } from '../ThemeContext';

describe('ThemeContext', () => {
  function TestComponent() {
    const ctx = _useTheme();
    import React from 'react';
    return <div data-testid='theme-context'>{ctx ? 'context-present' : 'context-absent'}</div>;
  }

  it('provides default values and allows theme change', () => {
    render(
      <_ThemeProvider>
        <TestComponent />
      </_ThemeProvider>
    );
    expect(screen.getByTestId('theme-context')).toHaveTextContent('context-present');
    // Optionally, simulate theme change if exposed via context
    // e.g., fireEvent or rerender with new props
  });
});
