/**
 * Global application context and provider for managing loading state, notifications, and user session.
 *
 * @module contexts/AppContext
 */
import React, { ReactNode, createContext, useContext, useState } from 'react';

/**
 * AppContextType
 * Global app context for loading, notifications, and user session.
 * @property {boolean} loading - Global loading state
 * @property {(loading: boolean) => void} setLoading - Setter for loading
 * @property {string | null} notification - Global notification message
 * @property {(msg: string | null) => void} setNotification - Setter for notification
 * @property {any} user - User session/profile object
 * @property {(user: any) => void} setUser - Setter for user
 */
export interface AppContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  notification: string | null;
  setNotification: (msg: string | null) => void;
  user: unknown;
  setUser: (user: unknown) => void;
}

/**
 * React context for global app state.
 */
const _AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider component.
 * Wrap your app with this provider to enable global app state.
 * @param {object} props - React children.
 * @returns {JSX.Element} The provider component.
 */
export const _AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [user, setUser] = useState<unknown>(null);

  return (
    // Removed unused @ts-expect-error: JSX is supported in this environment
    <_AppContext.Provider
      value={{ loading, setLoading, notification, setNotification, user, setUser }}
    >
      {children}
    </_AppContext.Provider>
  );
};

/**
 * useAppContext
 * Access the global app context in any component.
 */
export const _useAppContext = () => {
  const _ctx = useContext(_AppContext);
  if (!_ctx) throw new Error('useAppContext must be used within AppProvider');
  return _ctx;
};
