import { render, screen } from '@testing-library/react';
import { _AppProvider, _useAppContext } from '../AppContext';

const TestComponent = () => {
  const ctx = _useAppContext();
  return <div data-testid='user'>{String(ctx.user)}</div>;
};

describe('AppContext', () => {
  it('provides default values', () => {
    render(
      <_AppProvider>
        <TestComponent />
      </_AppProvider>
    );
    expect(screen.getByTestId('user')).toBeInTheDocument();
  });
});
