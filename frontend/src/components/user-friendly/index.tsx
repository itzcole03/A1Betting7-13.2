/**
 * User-Friendly Components Index
 *
 * NOTICE: All user-friendly components have been consolidated into the main A1BettingPlatform.tsx
 *
 * The enhanced A1BettingPlatform incorporates all the best features from:
 * - EnhancedUserFriendlyApp
 * - UserFriendlyApp (all variants)
 * - AnalyticsCommandCenter
 * - ArbitrageHunter
 * - MoneyMakerPro
 * - PortfolioCommander
 * - PrizePicksPro (all variants)
 * - PropOllama
 * - UltimateOpportunityScanner
 * - RiskEngineInterface
 *
 * For compatibility, we re-export the main platform components:
 */

// Main platform export
export { default as A1BettingPlatform } from '../A1BettingPlatform';
export { default as Dashboard } from '../Dashboard';
export { default as BettingInterface } from '../BettingInterface';
export { default as PredictionDisplay } from '../PredictionDisplay';
export { default as UserProfile } from '../UserProfile';

// Legacy compatibility exports
export { default as EnhancedUserFriendlyApp } from '../A1BettingPlatform';
export { default as UserFriendlyApp } from '../A1BettingPlatform';
export { default as UserFriendlyDashboard } from '../Dashboard';

// Export types for TypeScript compatibility
export type { default as UserFriendlyAppProps } from '../A1BettingPlatform';
