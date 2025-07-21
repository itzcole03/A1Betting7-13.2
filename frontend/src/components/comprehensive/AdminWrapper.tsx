import React from 'react';
// @ts-expect-error TS(6142): Module '../core/ErrorBoundary' was resolved to 'C:... Remove this comment to see the full error message
import { ErrorBoundary } from '../core/ErrorBoundary';
// @ts-expect-error TS(6142): Module './ComprehensiveAdminDashboard' was resolve... Remove this comment to see the full error message
import ComprehensiveAdminDashboard from './ComprehensiveAdminDashboard';

interface AdminWrapperProps {
  onToggleUserMode?: () => void;
}

const AdminWrapper: React.FC<AdminWrapperProps> = ({ onToggleUserMode }) => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ErrorBoundary>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ComprehensiveAdminDashboard onToggleUserMode={onToggleUserMode} />
    </ErrorBoundary>
  );
};

export default AdminWrapper;
