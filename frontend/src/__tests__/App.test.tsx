import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders onboarding/loading state by default', () => {
    render(<App />);
    // Accept either legacy onboarding text or current dashboard loading text
    expect(
      screen.getByText(/loading onboarding|loading dashboard/i)
    ).toBeInTheDocument();
  });
});
