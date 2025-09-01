import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
// Ensure axios is the manual mock for this test
jest.mock('axios');
import axios from 'axios';
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
    // Ensure health endpoint resolves so ApiHealthIndicator transitions to 'ok'
    (axios as any).get?.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/v2/health')) {
        return Promise.resolve({ data: { status: 'ok' }, status: 200 });
      }
      return Promise.resolve({ data: {} });
    });
    render(
      <MemoryRouter>
        <UserFriendlyApp />
      </MemoryRouter>
    );
    // Wait for admin button to appear
  const adminButton = await screen.findByRole('button', { name: /Admin/i });
  expect(adminButton).toBeDefined();
    // Simulate switching to user role
    const switchUserButton = await screen.findByRole('button', { name: /Switch to User/i, hidden: true });
    act(() => {
      switchUserButton.click();
    });
    await waitFor(() => {
      expect(screen.getByText(/User Dashboard|Betting Interface/i)).toBeDefined();
    });
  });
});
