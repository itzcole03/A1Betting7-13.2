/**
 * AppContextType
 * Global app context for loading, notifications, and user session.
 */
export interface AppContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  notification: string | null;
  setNotification: (msg: string | null) => void;
  user: any;
  setUser: (user: any) => void;
}

export {};
