import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Real-Time Updates and Performance Metrics E2E', () => {
  beforeEach(() => {
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('token', 'test-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['admin'],
      })
    );
  });
  it('shows real-time updates and performance metrics', async () => {
    render(<App />);
    // Wait for real-time update indicator
    expect(await screen.findByTestId('real-time-update-indicator')).toBeInTheDocument();
    // Wait for performance metrics
    expect(await screen.findByText(/Performance Metrics|Latency|Throughput/i)).toBeInTheDocument();
  });
});
