import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Theme,
  getThemeById,
  applyCSSVariables,
  saveTheme,
  loadTheme,
  getRecommendedTheme,
  DEFAULT_THEME,
} from './index';

interface ThemeContextType {
  currentTheme: Theme | null;
  currentThemeId: string;
  setTheme: (themeId: string) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  enableSystemTheme?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme,
  enableSystemTheme = true,
}) => {
  const [currentThemeId, setCurrentThemeId] = useState<string>(DEFAULT_THEME);
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTheme = () => {
      let themeId = defaultTheme || loadTheme();

      // If enableSystemTheme and no saved theme, use system preference
      if (enableSystemTheme && !localStorage.getItem('a1betting-theme')) {
        themeId = getRecommendedTheme();
      }

      const theme = getThemeById(themeId);
      if (theme) {
        setCurrentThemeId(themeId);
        setCurrentTheme(theme);
        applyCSSVariables(theme);
      } else {
        // Fallback to default theme if selected theme is not found
        const fallbackTheme = getThemeById(DEFAULT_THEME);
        if (fallbackTheme) {
          setCurrentThemeId(DEFAULT_THEME);
          setCurrentTheme(fallbackTheme);
          applyCSSVariables(fallbackTheme);
        }
      }

      setIsLoading(false);
    };

    initializeTheme();

    // Listen for system theme changes
    if (enableSystemTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        // Only auto-change if user hasn't manually set a theme
        if (!localStorage.getItem('a1betting-theme')) {
          const recommendedTheme = getRecommendedTheme();
          setTheme(recommendedTheme);
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [defaultTheme, enableSystemTheme]);

  const setTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    if (theme) {
      setCurrentThemeId(themeId);
      setCurrentTheme(theme);
      applyCSSVariables(theme);
      saveTheme(themeId);

      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { themeId, theme } }));
    }
  };

  const toggleTheme = () => {
    if (!currentTheme) return;

    // Toggle between dark and light versions of the current theme category
    if (currentTheme.isDark) {
      // Switch to light version
      const lightThemeId = currentThemeId.replace('-dark', '-light');
      const lightTheme = getThemeById(lightThemeId);
      if (lightTheme) {
        setTheme(lightThemeId);
      } else {
        // Fallback to cyber-light if no light version exists
        setTheme('cyber-light');
      }
    } else {
      // Switch to dark version
      const darkThemeId = currentThemeId.replace('-light', '-dark');
      const darkTheme = getThemeById(darkThemeId);
      if (darkTheme) {
        setTheme(darkThemeId);
      } else {
        // Fallback to cyber-dark if no dark version exists
        setTheme('cyber-dark');
      }
    }
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    currentThemeId,
    setTheme,
    toggleTheme,
    isLoading,
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-slate-900 flex items-center justify-center'>
        <div className='flex items-center space-x-3'>
          <div className='w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin'></div>
          <span className='text-white text-lg'>Loading theme...</span>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <div
        className={`min-h-screen transition-all duration-500 ease-in-out theme-${currentThemeId}`}
        data-theme={currentThemeId}
        style={{
          background:
            currentTheme?.colors.background ||
            'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Hook for listening to theme changes
export const useThemeListener = (callback: (theme: Theme) => void) => {
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      callback(event.detail.theme);
    };

    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeChange', handleThemeChange as EventListener);
  }, [callback]);
};

// Higher-order component for theme-aware components
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
) => {
  return (props: P) => {
    const { currentTheme } = useTheme();

    if (!currentTheme) {
      return null;
    }

    return <Component {...props} theme={currentTheme} />;
  };
};

export default ThemeProvider;
