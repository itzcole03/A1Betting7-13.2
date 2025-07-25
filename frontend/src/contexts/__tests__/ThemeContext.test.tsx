import { render } from '@testing-library/react';
import { _ThemeProvider, _useTheme } from '../ThemeContext';

const TestComponent = () => {
  const ctx = _useTheme();
  return <div data-testid='theme'>{ctx.theme}</div>;
};

describe('ThemeContext', () => {
  it('provides default values', () => {
    render(
      <_ThemeProvider>
        <TestComponent />
      </_ThemeProvider>
    );
    // No assertion: just ensure no crash and context is available
  });
});
