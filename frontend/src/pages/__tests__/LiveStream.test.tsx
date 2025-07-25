// LiveStream.test.tsx
// Automated tests for live stream page (LiveStream)

import { render, screen } from '@testing-library/react';
import LiveStream from '../LiveStream';

describe('LiveStream component', () => {
  it('renders the onboarding banner and safety tips', () => {
    render(<LiveStream />);
    expect(screen.getByText(/How to Use:/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety Tips:/i)).toBeInTheDocument();
    expect(screen.getByText(/Use an ad blocker for best experience./i)).toBeInTheDocument();
    expect(screen.getByText(/Open streams in a new tab if popups appear./i)).toBeInTheDocument();
    expect(screen.getByText(/No registration or payment is ever required./i)).toBeInTheDocument();
  });

  it('renders the header with the correct title and external link', () => {
    render(<LiveStream />);
    expect(screen.getByRole('heading', { name: /Live Sports Streams/i })).toBeInTheDocument();
    const streamEastLink = screen.getByRole('link', { name: 'StreamEast' }); // Exact match for the inline link
    expect(streamEastLink).toBeInTheDocument();
    expect(streamEastLink).toHaveAttribute('href', 'https://gostreameast.link/official/');
    expect(streamEastLink).toHaveAttribute('target', '_blank');
    expect(streamEastLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the button to open the live stream site', () => {
    render(<LiveStream />);
    const openStreamButton = screen.getByRole('link', { name: /Open StreamEast Live Streams/i });
    expect(openStreamButton).toBeInTheDocument();
    expect(openStreamButton).toHaveAttribute('href', 'https://gostreameast.link/official/');
    expect(openStreamButton).toHaveAttribute('target', '_blank');
    expect(openStreamButton).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(/You will be redirected to an external website/i)).toBeInTheDocument();
  });
});
