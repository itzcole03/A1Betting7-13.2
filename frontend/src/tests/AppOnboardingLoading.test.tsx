import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('App Onboarding and Loading States', () => {
  it('shows onboarding loading state by default', () => {
    render(<App />);
    expect(screen.getByText(/loading onboarding/i)).toBeInTheDocument();
  });

  it('transitions from loading to onboarding steps', async () => {
    render(<App />);
    // Simulate loading complete
    await waitFor(() => {
      expect(screen.getByText(/welcome to a1betting/i)).toBeInTheDocument();
    });
    // Simulate user onboarding step
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    expect(screen.getByText(/choose your favorite sport/i)).toBeInTheDocument();
  });

  it('shows loading overlay when fetching analysis', async () => {
    render(<App />);
    // Simulate navigation to analysis page
    const analysisTab = screen.getByRole('tab', { name: /analysis/i });
    fireEvent.click(analysisTab);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument();
    });
  });
});
