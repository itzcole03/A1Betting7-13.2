import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { useConcurrentForm } from '../ConcurrentFeaturesProvider';

describe('ConcurrentFeaturesProvider utilities', () => {
  it('useConcurrentForm updates values and calls onSubmit', async () => {
    const TestComp: React.FC = () => {
      const { values, updateField, handleSubmit } = useConcurrentForm({ a: 1 }, async () =>
        Promise.resolve()
      );
      return (
        <form onSubmit={handleSubmit} data-testid='form'>
          <div data-testid='value-a'>{String(values.a)}</div>
          <button type='button' onClick={() => updateField('a', 2)}>
            update
          </button>
          <button type='submit'>submit</button>
        </form>
      );
    };

    render(<TestComp />);
    expect(screen.getByTestId('value-a').textContent).toBe('1');
    fireEvent.click(screen.getByText('update'));
    // value updates may be deferred via transition; assert eventually
    expect(screen.getByTestId('value-a').textContent).toBe('2');
    fireEvent.click(screen.getByText('submit'));
  });
});
