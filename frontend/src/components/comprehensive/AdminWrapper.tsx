import React from 'react';
import { ErrorBoundary } from '../core/ErrorBoundary';
import ComprehensiveAdminDashboard from './ComprehensiveAdminDashboard';

interface AdminWrapperProps {
  onToggleUserMode?: () => void;
}

const AdminWrapper: React.FC<AdminWrapperProps> = ({ onToggleUserMode }) => {
  return (
    <ErrorBoundary>
      <ComprehensiveAdminDashboard onToggleUserMode={onToggleUserMode} />
    </ErrorBoundary>
  );
};

export default AdminWrapper;
