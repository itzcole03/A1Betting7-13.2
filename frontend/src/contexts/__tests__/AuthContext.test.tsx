import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../AuthContext';

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
      // @ts-expect-error TS(2339): Property 'setUser' does not exist on type 'AuthCon... Remove this comment to see the full error message
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
      // @ts-expect-error TS(2339): Property 'setUser' does not exist on type 'AuthCon... Remove this comment to see the full error message
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
      // @ts-expect-error TS(2339): Property 'setUser' does not exist on type 'AuthCon... Remove this comment to see the full error message
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
      // @ts-expect-error TS(2339): Property 'setUser' does not exist on type 'AuthCon... Remove this comment to see the full error message
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
