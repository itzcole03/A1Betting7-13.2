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
  user: any;
  setUser: (user: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider
 * Wrap your app with this provider to enable global app state.
 * @param {ReactNode} children
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  return (
    <AppContext.Provider
      value={{ loading, setLoading, notification, setNotification, user, setUser }}
    >
      {children}
    </AppContext.Provider>
  );
};

/**
 * useAppContext
 * Access the global app context in any component.
 */
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
