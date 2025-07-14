import { useState, useEffect, useCallback } from 'react';
import {
  adminService,
  AdminStats,
  AdminActivity,
  SystemStatus,
  UserManagementData,
} from '../services/AdminService';

/**
 * Custom hook for managing admin dashboard data
 * Provides real-time data fetching with fallback to mock data
 */
export const useAdminData = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [userData, setUserData] = useState<UserManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch admin statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const data = await adminService.getAdminStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load admin statistics');
      console.error('Error fetching admin stats:', err);
    }
  }, []);

  /**
   * Fetch recent activity
   */
  const fetchActivity = useCallback(async () => {
    try {
      const data = await adminService.getRecentActivity(10);
      setActivity(data);
    } catch (err) {
      setError('Failed to load recent activity');
      console.error('Error fetching activity:', err);
    }
  }, []);

  /**
   * Fetch system status
   */
  const fetchSystemStatus = useCallback(async () => {
    try {
      const data = await adminService.getSystemStatus();
      setSystemStatus(data);
    } catch (err) {
      setError('Failed to load system status');
      console.error('Error fetching system status:', err);
    }
  }, []);

  /**
   * Fetch user management data
   */
  const fetchUserData = useCallback(async () => {
    try {
      const data = await adminService.getUserManagementData();
      setUserData(data);
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error fetching user data:', err);
    }
  }, []);

  /**
   * Refresh all data
   */
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchStats(), fetchActivity(), fetchSystemStatus(), fetchUserData()]);
    } catch (err) {
      setError('Failed to refresh admin data');
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchActivity, fetchSystemStatus, fetchUserData]);

  /**
   * Execute admin action
   */
  const executeAction = useCallback(
    async (action: string, params?: any) => {
      try {
        setLoading(true);
        const result = await adminService.executeAdminAction(action, params);

        // Refresh data after action
        await refreshAllData();

        return result;
      } catch (err) {
        setError(`Failed to execute action: ${action}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshAllData]
  );

  /**
   * Start real-time updates
   */
  const startRealTimeUpdates = useCallback(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchActivity();
      fetchSystemStatus();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [fetchStats, fetchActivity, fetchSystemStatus]);

  // Initial data load
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Start real-time updates
  useEffect(() => {
    const cleanup = startRealTimeUpdates();
    return cleanup;
  }, [startRealTimeUpdates]);

  return {
    // Data
    stats,
    activity,
    systemStatus,
    userData,

    // State
    loading,
    error,

    // Actions
    refreshAllData,
    executeAction,
    fetchStats,
    fetchActivity,
    fetchSystemStatus,
    fetchUserData,
  };
};

export default useAdminData;
