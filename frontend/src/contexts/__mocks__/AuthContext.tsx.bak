import React from 'react';

export const useAuth = () => {
  // eslint-disable-next-line no-console
  console.log('[MOCK] useAuth called');
  return {
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
    error: null,
    isAdmin: true,
    isAuthenticated: true,
    requiresPasswordChange: false,
    login: jest.fn(),
    logout: jest.fn(),
    changePassword: jest.fn(),
    clearError: jest.fn(),
    register: jest.fn(),
  };
};

export const _AuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
