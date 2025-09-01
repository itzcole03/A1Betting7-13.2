import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders onboarding/loading state by default', async () => {
    render(<App />);
    // The app performs async health checks and may render the dashboard synchronously
    // Wait for the API health indicator to be present which is stable across variants
    await waitFor(() => expect(screen.getByTestId('api-health-indicator')).toBeInTheDocument());
    expect(screen.getByTestId('api-health-indicator')).toHaveTextContent(/checking|backend/i);
  });
});
