import { act, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('User Context Switching E2E', () => {
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

  it('switches user context and updates permissions', async () => {
    render(<App />);
    // Wait for admin dashboard
    expect(await screen.findByText(/Admin Dashboard|User Management/i)).toBeInTheDocument();
    // Simulate switching to user role
    const switchUserButton = await screen.findByRole('button', { name: /Switch to User/i });
    act(() => {
      switchUserButton.click();
    });
    await waitFor(() => {
      expect(screen.getByText(/User Dashboard|Betting Interface/i)).toBeInTheDocument();
    });
  });
});
