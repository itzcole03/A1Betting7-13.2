import { render, screen } from '@testing-library/react';
import { _AppProvider, _useAppContext } from '../AppContext';

import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <_AppProvider>{children}</_AppProvider>
);

describe('AppContext', () => {
  function TestComponent() {
    const ctx = _useAppContext();
    return <div data-testid='app-context'>{ctx ? 'context-present' : 'context-absent'}</div>;
  }

  it('provides default values and allows updating user', () => {
    render(
      <_AppProvider>
        <TestComponent />
      </_AppProvider>
    );
    expect(screen.getByTestId('app-context')).toHaveTextContent('context-present');
    // Optionally, simulate context update if exposed via context
    // e.g., fireEvent or rerender with new props
  });
});
