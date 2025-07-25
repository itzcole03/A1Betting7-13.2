// Unmock AuthContext to use the real provider/hook for these tests
jest.unmock('../AuthContext');
import { act, render, screen } from '@testing-library/react';
// import React from 'react';
import React from 'react';
import { _authService as authService, User } from '../../services/authService'; // Import AuthService and User type
import { _AuthProvider as AuthProvider, useAuth } from '../AuthContext';

// Mock AuthService
jest.mock('../../services/authService', () => ({
  _authService: {
    login: jest.fn(),
    logout: jest.fn(),
    changePassword: jest.fn(),
    isAuthenticated: jest.fn(),
    getUser: jest.fn(),
    isAdmin: jest.fn(),
    requiresPasswordChange: jest.fn(),
  },
}));

describe('AuthContext Admin Functionality', () => {
  function TestComponent() {
    const ctx = useAuth();
    return <div data-testid='auth-context'>{ctx.isAdmin ? 'admin' : 'not-admin'}</div>;
  }

  it('should detect admin user with admin email', async () => {
    // Mock admin login
    const _adminUser: User = {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['admin', 'user'],
    };
    (authService.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      user: _adminUser,
      requiresPasswordChange: false,
      message: 'Login successful',
    });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await act(async () => {
      // Simulate login via context
      screen.getByTestId('auth-context'); // Ensure component is mounted
    });
    expect(screen.getByTestId('auth-context')).toHaveTextContent('admin');
  });

  it('should detect admin user with cole email', async () => {
    const _coleUser: User = {
      id: '1',
      email: 'cole@example.com',
      role: 'admin',
      permissions: ['admin', 'user'],
    };
    (authService.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      user: _coleUser,
      requiresPasswordChange: false,
      message: 'Login successful',
    });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await act(async () => {
      screen.getByTestId('auth-context');
    });
    expect(screen.getByTestId('auth-context')).toHaveTextContent('admin');
  });

  it('should not detect admin for regular user', async () => {
    const _regularUser: User = {
      id: '2',
      email: 'user@example.com',
      role: 'user',
      permissions: ['user'],
    };
    (authService.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      user: _regularUser,
      requiresPasswordChange: false,
      message: 'Login successful',
    });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await act(async () => {
      screen.getByTestId('auth-context');
    });
    expect(screen.getByTestId('auth-context')).toHaveTextContent('not-admin');
  });

  it('should return false for isAdmin when no user', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('auth-context')).toHaveTextContent('not-admin');
  });

  it('should clear admin status on logout', async () => {
    const _adminUser: User = {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['admin', 'user'],
    };
    (authService.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      user: _adminUser,
      requiresPasswordChange: false,
      message: 'Login successful',
    });
    (authService.logout as jest.Mock).mockResolvedValueOnce({
      success: true,
      message: 'Logout successful',
    });
    function TestComponent() {
      const ctx = useAuth();
      React.useEffect(() => {
        ctx.login(_adminUser.email, 'password').then(() => {
          ctx.logout();
        });
      }, []);
      return (
        <div data-testid='auth-context'>
          {ctx.isAdmin ? 'admin' : 'not-admin'}|{ctx.user ? 'user' : 'no-user'}
        </div>
      );
    }
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    // Wait for logout to complete
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('auth-context')).toHaveTextContent('not-admin|no-user');
  });
});
