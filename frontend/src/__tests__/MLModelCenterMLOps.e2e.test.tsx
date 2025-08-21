import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import UserFriendlyApp from '../components/user-friendly/UserFriendlyApp';

describe('ML Model Center and MLOps E2E', () => {
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
  it('renders ML model center and MLOps pipeline controls', async () => {
    render(
      <MemoryRouter initialEntries={["/ml-models"]}>
        <UserFriendlyApp />
      </MemoryRouter>
    );
    // Wait for ML Model Center heading (use stable data-testid)
    expect(await screen.findByTestId('ml-model-center-heading')).toBeInTheDocument();
  // Wait for Model Registry table to confirm page rendered
  expect(await screen.findByText(/Model Registry/i)).toBeInTheDocument();
  });
});
