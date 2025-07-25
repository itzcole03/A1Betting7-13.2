// Unmock AuthContext to use the real provider/hook for these tests
jest.unmock('../AuthContext');
import { act, renderHook } from '@testing-library/react';
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
  const _wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should detect admin user with admin email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: _wrapper });

    // Mock admin login
    const _adminUser: User = {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['admin', 'user'],
    };

    // Mock authService.login for this specific test case
    (authService.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      user: _adminUser,
      requiresPasswordChange: false,
      message: 'Login successful',
    });

    await act(async () => {
      await result.current.login(_adminUser.email, 'password'); // Use login function
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('should detect admin user with cole email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: _wrapper });

    // Mock cole admin login
    const _coleUser: User = {
      id: '1',
      email: 'cole@example.com',
      role: 'admin',
      permissions: ['admin', 'user'],
    };

    // Mock authService.login for this specific test case
    (authService.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      user: _coleUser,
      requiresPasswordChange: false,
      message: 'Login successful',
    });

    await act(async () => {
      await result.current.login(_coleUser.email, 'password'); // Use login function
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('should not detect admin for regular user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: _wrapper });

    // Mock regular user login
    const _regularUser: User = {
      id: '2',
      email: 'user@example.com',
      role: 'user',
      permissions: ['user'],
    };

    // Mock authService.login for this specific test case
    (authService.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      user: _regularUser,
      requiresPasswordChange: false,
      message: 'Login successful',
    });

    await act(async () => {
      await result.current.login(_regularUser.email, 'password'); // Use login function
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('should return false for isAdmin when no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: _wrapper });

    // No login, so user should be null by default
    expect(result.current.isAdmin).toBe(false);
  });

  it('should clear admin status on logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: _wrapper });

    // Mock admin login first
    const _adminUser: User = {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['admin', 'user'],
    };

    // Mock authService.login
    (authService.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      user: _adminUser,
      requiresPasswordChange: false,
      message: 'Login successful',
    });

    await act(async () => {
      await result.current.login(_adminUser.email, 'password'); // Use login function
    });

    expect(result.current.isAdmin).toBe(true);

    // Mock logout
    (authService.logout as jest.Mock).mockResolvedValueOnce({
      success: true,
      message: 'Logout successful',
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });
});
