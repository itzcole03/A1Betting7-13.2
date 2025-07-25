import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const _initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const _ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * ThemeProvider and useTheme hook
 *
 * Provides global theme context for the app, supporting 'light', 'dark', and 'system' (auto) themes.
 * Theme is persisted in localStorage and applied to the root HTML element for CSS-based theming.
 * Use the useTheme hook to access and set the current theme anywhere in the app.
 * Intended for use in the settings page and throughout the app for consistent theming.
 */
export function ThemeProvider(_{
  children, _defaultTheme = 'system', _storageKey = 'vite-ui-theme', _...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const _root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const _systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const _value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * useTheme hook
 *
 * Access the global theme context.
 * Intended for use in the settings page and throughout the app for consistent theming.
 */
export const _useTheme = () => {
  const _context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
