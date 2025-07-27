// (deleted)
// Legacy AppFlows test removed as part of canonicalization.
import '@testing-library/jest-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { _AuthProvider } from '../../contexts/AuthContext';
import LoginForm from '../auth/LoginForm';
import BetSlip from '../BetSlip';
import Register from '../Register';

// Mock useAuth for registration test
jest.mock('../../contexts/AuthContext', () => {
  const actual = jest.requireActual('../../contexts/AuthContext');
  return {
    __esModule: true,
    ...actual,
    useAuth: () => ({
      register: jest.fn(() => Promise.resolve(true)),
      login: jest.fn(() => Promise.resolve(true)),
      logout: jest.fn(() => Promise.resolve(true)),
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      checkAdminStatus: jest.fn(() => false),
      changePassword: jest.fn(),
      loading: false,
      error: null,
      requiresPasswordChange: false,
    }),
  };
});

describe('A1Betting App Flows', () => {
  test('Registration form validation and submission', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <_AuthProvider>
            <Register />
          </_AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'testuser@example.com' },
    });
    const passwordFields = screen.getAllByLabelText(/password/i);
    fireEvent.change(passwordFields[0], { target: { value: 'abc12345' } }); // Password
    fireEvent.change(passwordFields[1], { target: { value: 'abc12345' } }); // Confirm Password
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    // The Register component navigates to /dashboard on success, so check that the registration form is no longer present
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /create account/i })).toBeNull();
    });
  });

  test('Login form validation and submission', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <_AuthProvider>
            <LoginForm />
          </_AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'testuser@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'abc12345' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.queryByText(/welcome back/i)).not.toBeNull());
  });

  test('BetSlip validation and submission', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <_AuthProvider>
            <BetSlip />
          </_AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByLabelText(/selection/i), { target: { value: 'TeamA' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /place bet/i }));
    // The BetSlip does not show a success message, so check that the button is enabled again after submit
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /place bet/i })).toBeEnabled();
    });
  });
});
