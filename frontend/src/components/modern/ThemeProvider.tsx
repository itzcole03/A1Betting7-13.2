import React, { useEffect } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/store/useStore' or its corre... Remove this comment to see the full error message
import { useStore } from '@/store/useStore';

export const _ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // @ts-expect-error TS(2304): Cannot find name 'theme'.
    if (theme === 'dark') {
      // @ts-expect-error TS(2304): Cannot find name 'html'.
      html.classList.add('dark');
    } else {
      // @ts-expect-error TS(2304): Cannot find name 'html'.
      html.classList.remove('dark');
    }
  // @ts-expect-error TS(2304): Cannot find name 'theme'.
  }, [theme]);
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <>{children}</>;
};
