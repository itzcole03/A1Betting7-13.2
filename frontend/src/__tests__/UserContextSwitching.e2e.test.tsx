import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserFriendlyApp from '../components/user-friendly/UserFriendlyApp';

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
    render(
      <MemoryRouter>
        <UserFriendlyApp />
      </MemoryRouter>
    );
    // Wait for admin dashboard (robust matcher for split/nested nodes)
    expect(
      await screen.findByText((content, node) => {
        const text = node?.textContent || '';
        return /Admin Dashboard|User Management/i.test(text);
      })
    ).toBeInTheDocument();
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
