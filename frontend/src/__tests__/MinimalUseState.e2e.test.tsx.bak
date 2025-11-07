import { render, screen } from '@testing-library/react';
import * as React from 'react';
const useState = React.useState;

describe('Minimal useState E2E', () => {
  it('renders and updates state', () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return (
        <div>
          <span data-testid='count'>{count}</span>
          <button onClick={() => setCount(c => c + 1)}>Increment</button>
        </div>
      );
    }
    render(<Counter />);
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
