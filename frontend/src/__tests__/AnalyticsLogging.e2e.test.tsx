import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('Analytics and Logging E2E', () => {
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
  it('shows analytics dashboard and logs user actions', async () => {
    render(<App />);
    // Wait for analytics dashboard heading
    expect(await screen.findByText(/Analytics Dashboard|Performance Metrics/i)).toBeInTheDocument();
    // Simulate user action and check for log output
    // (Assume UnifiedAnalyticsService logs to console for test)
    window.console.log = jest.fn();
    const analyticsButton = await screen.findByRole('button', {
      name: /View Metrics|Refresh Analytics/i,
    });
    analyticsButton.click();
    await waitFor(() => {
      expect(window.console.log).toHaveBeenCalledWith(
        expect.stringMatching(/User action: View Metrics|Analytics refreshed/i)
      );
    });
  });
});
