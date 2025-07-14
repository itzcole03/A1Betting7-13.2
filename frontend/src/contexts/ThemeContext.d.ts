/**
 * ThemeContextType
 * Provides theme state (dark/light) and toggling for the app.
 */
export interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export {};
