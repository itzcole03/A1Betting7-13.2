import { render, screen } from '@testing-library/react';
import { _WebSocketProvider, _useWebSocket } from '../WebSocketContext';

function TestComponent() {
  const ctx = _useWebSocket();
  return <div data-testid='ws-context'>{ctx ? 'context-present' : 'context-absent'}</div>;
}

describe('WebSocketContext', () => {
  it('provides default values', () => {
    render(
      <_WebSocketProvider>
        <TestComponent />
      </_WebSocketProvider>
    );
    expect(screen.getByTestId('ws-context')).toHaveTextContent('context-present');
    // No assertion: just ensure no crash and context is available
  });
});
