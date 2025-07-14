import React from 'react.ts';
interface PerformanceAnalyticsDashboardProps {
  userId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  showAdvancedMetrics?: boolean;
}
export declare const PerformanceAnalyticsDashboard: React.FC<PerformanceAnalyticsDashboardProps>;
export default PerformanceAnalyticsDashboard;
