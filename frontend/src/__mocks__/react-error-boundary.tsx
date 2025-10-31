import React from 'react';

// Lightweight test mock for react-error-boundary.
// Exports a passthrough ErrorBoundary that simply renders children.
export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default ErrorBoundary;
