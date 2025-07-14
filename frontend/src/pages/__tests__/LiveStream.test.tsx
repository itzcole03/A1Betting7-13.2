// LiveStream.test.tsx
// Automated tests for live stream page (LiveStream)

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveStream from '../LiveStream';

describe('LiveStream', () => {
  it('renders onboarding banner', () => {
    render(<LiveStream />);
    expect(screen.getByText(/How to Use:/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety Tips:/i)).toBeInTheDocument();
  });

  it('loads iframe with correct src', () => {
    render(<LiveStream />);
    const iframe = screen.getByTitle('StreamEast Live Sports');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://gostreameast.link/official/');
  });

  it('iframe is accessible', () => {
    render(<LiveStream />);
    const iframe = screen.getByLabelText('StreamEast Live Sports Preview');
    expect(iframe).toBeInTheDocument();
  });

  // Note: Simulating iframe load errors is not natively supported in jsdom, but we can check fallback UI if implemented
  // it('shows fallback if iframe fails', () => {
  //   // Implement fallback UI in LiveStream.tsx for this test
  // });
});
