import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '../App';

describe('App', () => {
  it('renders onboarding loading state by default', () => {
    render(<App />);
    expect(screen.getByText(/loading onboarding/i)).toBeInTheDocument();
  });
});
