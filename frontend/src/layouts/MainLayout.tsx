import React, { ReactNode } from 'react';
import { AppProvider } from '../contexts/AppContext';
import { ThemeProvider } from '../contexts/ThemeContext';

/**
 * MainLayout
 * Layout wrapper for the main app. Provides theme and global app context.
 * @param {ReactNode} children
 */
export const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <AppProvider>{children}</AppProvider>
  </ThemeProvider>
);
