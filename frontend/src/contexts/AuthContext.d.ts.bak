/**
 * AuthContextType
 * Provides authentication state and actions for the app.
 */
export interface AuthContextType {
  user: unknown;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  setUser: (user: unknown) => void;
}

export {};
