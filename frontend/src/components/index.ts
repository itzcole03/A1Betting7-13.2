// Main components export file - clean, organized structure

// === MAIN APPLICATION ===
export { default as UserFriendlyApp } from './user-friendly/UserFriendlyApp';

// === CORE FEATURES ===
export { default as PropOllamaUnified } from './PropOllamaUnified';
export { default as PredictionDisplay } from './PredictionDisplay';
export { default as MoneyMaker } from './MoneyMaker/UltimateMoneyMaker';

// === UI COMPONENTS (Canonical) ===
export * from './ui';

// === CORE COMPONENTS ===
export { ErrorBoundary } from './core/ErrorBoundary';
export { default as Layout } from './core/Layout';

// === AUTH COMPONENTS ===
export { default as AuthPage } from './auth/AuthPage';
export { default as PasswordChangeForm } from './auth/PasswordChangeForm';

// === ADMIN COMPONENTS ===
export { default as AdminDashboard } from './AdminDashboard';
export { default as AnalyticsDashboard } from './AnalyticsDashboard';
export { default as BettingDashboard } from './BettingDashboard';
