import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import React from 'react';

// Mock the authService
jest.mock('../AuthContext', () => {
  const actualModule = jest.requireActual('../AuthContext');
  return {
    ...actualModule,
    AuthProvider: ({ children }: { children: React.ReactNode }) => {
      const mockAuthValue = {
        user: null,
        isAdmin: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        setUser: jest.fn(),
        checkAdminStatus: jest.fn(),
        loading: false,
        error: null,
      };

      return (
        <actualModule.AuthContext.Provider value={mockAuthValue}>
          {children}
        </actualModule.AuthContext.Provider>
      );
    },
  };
});

describe('AuthContext Admin Functionality', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should detect admin user with admin email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Mock admin login
    const adminUser = {
      id: 1,
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['admin', 'user'],
    };

    act(() => {
      result.current.setUser(adminUser);
    });

    expect(result.current.checkAdminStatus()).toBe(true);
  });

  it('should detect admin user with cole email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Mock cole admin login
    const coleUser = {
      id: 1,
      email: 'cole@example.com',
      role: 'admin',
      permissions: ['admin', 'user'],
    };

    act(() => {
      result.current.setUser(coleUser);
    });

    expect(result.current.checkAdminStatus()).toBe(true);
  });

  it('should not detect admin for regular user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Mock regular user login
    const regularUser = {
      id: 2,
      email: 'user@example.com',
      role: 'user',
      permissions: ['user'],
    };

    act(() => {
      result.current.setUser(regularUser);
    });

    expect(result.current.checkAdminStatus()).toBe(false);
  });

  it('should return false for checkAdminStatus when no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.checkAdminStatus()).toBe(false);
  });

  it('should clear admin status on logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Mock admin login first
    const adminUser = {
      id: 1,
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['admin', 'user'],
    };

    act(() => {
      result.current.setUser(adminUser);
    });

    expect(result.current.checkAdminStatus()).toBe(true);

    // Mock logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.checkAdminStatus()).toBe(false);
  });
});
