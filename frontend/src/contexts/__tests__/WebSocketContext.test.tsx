import { render } from '@testing-library/react';
import { _WebSocketProvider, _useWebSocket } from '../WebSocketContext';

const TestComponent = () => {
  const ctx = _useWebSocket();
  return <div data-testid='connected'>{String(ctx.connected)}</div>;
};

describe('WebSocketContext', () => {
  it('provides default values', () => {
    render(
      <_WebSocketProvider>
        <TestComponent />
      </_WebSocketProvider>
    );
    // No assertion: just ensure no crash and context is available
  });
});
