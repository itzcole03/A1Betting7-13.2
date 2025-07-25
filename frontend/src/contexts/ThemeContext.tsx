/**
 * Theme context and provider for managing light/dark mode and toggling theme state.
 *
 * @module contexts/ThemeContext
 */
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

/**
 * ThemeContextType
 * Provides theme state (dark/light) and toggling for the app.
 * @property {string} theme - Current theme ('light' | 'dark')
 * @property {(theme: string) => void} setTheme - Setter for theme
 * @property {() => void} toggleTheme - Toggle between light and dark mode
 */
export interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

/**
 * React context for theme state and toggling.
 */
const _ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider component.
 * Wrap your app with this provider to enable theme state and toggling.
 * @param {object} props - React children.
 * @returns {JSX.Element} The provider component.
 */
export const _ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const _toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    // Removed unused @ts-expect-error: JSX is supported in this environment
    <_ThemeContext.Provider value={{ theme, setTheme, toggleTheme: _toggleTheme }}>
      {children}
    </_ThemeContext.Provider>
  );
};

/**
 * useTheme
 * Access the theme context in any component.
 */
export const _useTheme = () => {
  const _ctx = useContext(_ThemeContext);
  if (!_ctx) throw new Error('useTheme must be used within ThemeProvider');
  return _ctx;
};
