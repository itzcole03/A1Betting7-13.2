/**
 * AppContextType
 * Global app context for loading, notifications, and user session.
 */
export interface AppContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  notification: string | null;
  setNotification: (msg: string | null) => void;
  user: unknown;
  setUser: (user: unknown) => void;
}

export {};
