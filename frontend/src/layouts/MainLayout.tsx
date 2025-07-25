import React, { ReactNode } from 'react';
// @ts-expect-error TS(6142): Module '../contexts/AppContext' was resolved to 'C... Remove this comment to see the full error message
import { AppProvider } from '../contexts/AppContext';
// @ts-expect-error TS(6142): Module '../contexts/ThemeContext' was resolved to ... Remove this comment to see the full error message
import { ThemeProvider } from '../contexts/ThemeContext';

/**
 * MainLayout
 * Layout wrapper for the main app. Provides theme and global app context.
 * @param {ReactNode} children
 */
export const _MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <ThemeProvider>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <AppProvider>{children}</AppProvider>
  </ThemeProvider>
);
