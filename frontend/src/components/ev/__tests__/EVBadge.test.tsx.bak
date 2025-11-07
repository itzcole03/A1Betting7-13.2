import React from 'react';
import { render } from '@testing-library/react';
import EVBadge from '../EVBadge';

describe('EVBadge', () => {
  it('renders EV percentage', () => {
    const { getByText } = render(<EVBadge edgePct={5.3} />);
    expect(getByText(/5\.3% EV/)).toBeInTheDocument();
  });

  it('applies correct color tiers', () => {
    const { rerender, getByTestId } = render(<EVBadge edgePct={2.5} />);
    expect(getByTestId('ev-badge').className).toMatch(/bg-gray-400/);
    rerender(<EVBadge edgePct={3.2} />);
    expect(getByTestId('ev-badge').className).toMatch(/bg-amber-500/);
    rerender(<EVBadge edgePct={5.1} />);
    expect(getByTestId('ev-badge').className).toMatch(/bg-lime-500/);
    rerender(<EVBadge edgePct={8.0} />);
    expect(getByTestId('ev-badge').className).toMatch(/bg-emerald-600/);
  });
});
