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
// @ts-expect-error TS(2305): Module '"../A1BettingPlatform"' has no exported me... Remove this comment to see the full error message
export { default as A1BettingPlatform } from '../A1BettingPlatform';
export { default as Dashboard } from '../Dashboard';
// @ts-expect-error TS(6142): Module '../BettingInterface' was resolved to 'C:/U... Remove this comment to see the full error message
export { default as BettingInterface } from '../BettingInterface';
// @ts-expect-error TS(6142): Module '../PredictionDisplay' was resolved to 'C:/... Remove this comment to see the full error message
export { default as PredictionDisplay } from '../PredictionDisplay';
// @ts-expect-error TS(6142): Module '../UserProfile' was resolved to 'C:/Users/... Remove this comment to see the full error message
export { default as UserProfile } from '../UserProfile';

// Legacy compatibility exports
// @ts-expect-error TS(2305): Module '"../A1BettingPlatform"' has no exported me... Remove this comment to see the full error message
export { default as EnhancedUserFriendlyApp } from '../A1BettingPlatform';
// @ts-expect-error TS(2305): Module '"../A1BettingPlatform"' has no exported me... Remove this comment to see the full error message
export { default as UserFriendlyApp } from '../A1BettingPlatform';
export { default as UserFriendlyDashboard } from '../Dashboard';

// Export types for TypeScript compatibility
// @ts-expect-error TS(2305): Module '"../A1BettingPlatform"' has no exported me... Remove this comment to see the full error message
export type { default as UserFriendlyAppProps } from '../A1BettingPlatform';
