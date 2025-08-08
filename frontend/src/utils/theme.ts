import React from 'react';

// Unified theme utility using Tailwind CSS conventions
export type ThemeMode = 'light' | 'dark';

export const getThemeMode = (): ThemeMode => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const useThemeMode = (): ThemeMode => {
  // React hook for theme mode detection
  const [mode, setMode] = React.useState<ThemeMode>(getThemeMode());
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setMode(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mode;
};

// Example usage: apply Tailwind classes based on theme mode
export const getThemeClasses = (mode: ThemeMode) => {
  return mode === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
};
