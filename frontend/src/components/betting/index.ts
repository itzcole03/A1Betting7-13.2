/**
 * Betting Components - Centralized Exports
 * Following A1Betting Component Coding Standards
 */

// Core betting components (working implementations)
export { BetSlipComponent } from './BetSlipComponent';

// Re-export types for easy access
export type {
  BettingOpportunity,
  BetSlip,
  BetSlipItem,
  BetSlipComponentProps,
  BettingOpportunityCardProps,
  BettingDashboardProps,
  BettingFilters,
  BettingHistoryProps,
  BettingAnalyticsProps,
  RiskLevel,
  BettingSortOption,
  TimeRange,
  BetStatus,
  HistoricalBet,
  BettingEventHandlers,
  UseBettingStateReturn,
  BettingConfig,
  BettingError,
  BettingApiResponse,
  PlaceBetResponse
} from './types';

// Lazy-loaded components for better performance
export const BettingDashboard = React.lazy(() => import('./core/BettingDashboard'));
export const BettingAnalytics = React.lazy(() => import('./core/BettingAnalytics'));
export const BettingHistory = React.lazy(() => import('./core/BettingHistory'));

// Re-export React for convenience
import React from 'react';
