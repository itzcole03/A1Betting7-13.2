/**
 * Smoke tests for typed UI components (Input, Label, Select).
 * Verifies they render with minimal required props and refs.
 */
import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from '../components/base/Input';
import { Label } from '../components/base/Label';
import { Select } from '../components/base/Select';

describe('UI Component Typing Smoke Tests', () => {
  test('Input renders with ref and error', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} error='Required' placeholder='User' />);
    const input = screen.getByTestId('ui-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(ref.current).not.toBeNull();
  });

  test('Label associates with input via htmlFor', () => {
    render(
      <div>
        <Label htmlFor='email' requiredMark>
          Email
        </Label>
        <Input id='email' />
      </div>
    );
    const label = screen.getByTestId('ui-label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'email');
  });

  test('Select renders provided options', () => {
    render(
      <Select options={[{ value: '1', label: 'One' }, { value: '2', label: 'Two' }]} />
    );
    const select = screen.getByTestId('ui-select');
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll('option').length).toBe(2);
  });
});
