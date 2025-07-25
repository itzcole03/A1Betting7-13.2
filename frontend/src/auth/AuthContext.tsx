import React, { useEffect, useState } from 'react';
import { _AuthContext, login as backendLogin, register as backendRegister } from './authUtils';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token and get user info
      fetch('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            logout();
            throw new Error('Token validation failed');
          }
        })
        .then(userData => {
          setUser(userData);
        })
        .catch(error => {
          //           console.error('Auth verification failed:', error);
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const result = await backendLogin(username, password);
    if (result.success) {
      setToken(localStorage.getItem('auth_token'));
      setUser({ username });
    }
    return result;
  };

  const register = async (userData: Record<string, unknown>) => {
    const result = await backendRegister(userData);
    if (result.success) {
      setToken(localStorage.getItem('auth_token'));
      setUser({ username: userData.username });
    }
    return result;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <_AuthContext.Provider value={value}>{children}</_AuthContext.Provider>;
};

export default AuthProvider;
