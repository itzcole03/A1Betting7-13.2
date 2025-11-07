#!/bin/bash
echo "Phase 1: Deleting all duplicate component files..."

set -e  # Exit on error

if [ -f "frontend/src/App.tsx" ]; then
    git rm -f "frontend/src/App.tsx"
    echo "Deleted: frontend/src/App.tsx"
else
    echo "Not found (skipping): frontend/src/App.tsx"
fi
if [ -f "frontend/legacy-root-src/main.tsx" ]; then
    git rm -f "frontend/legacy-root-src/main.tsx"
    echo "Deleted: frontend/legacy-root-src/main.tsx"
else
    echo "Not found (skipping): frontend/legacy-root-src/main.tsx"
fi
if [ -f "frontend/src/main.tsx" ]; then
    git rm -f "frontend/src/main.tsx"
    echo "Deleted: frontend/src/main.tsx"
else
    echo "Not found (skipping): frontend/src/main.tsx"
fi
if [ -f "frontend/legacy-root-src/AnalyticsTab.tsx" ]; then
    git rm -f "frontend/legacy-root-src/AnalyticsTab.tsx"
    echo "Deleted: frontend/legacy-root-src/AnalyticsTab.tsx"
else
    echo "Not found (skipping): frontend/legacy-root-src/AnalyticsTab.tsx"
fi
if [ -f "frontend/src/components/elite/index.tsx" ]; then
    git rm -f "frontend/src/components/elite/index.tsx"
    echo "Deleted: frontend/src/components/elite/index.tsx"
else
    echo "Not found (skipping): frontend/src/components/elite/index.tsx"
fi
if [ -f "frontend/src/components/lazy/index.tsx" ]; then
    git rm -f "frontend/src/components/lazy/index.tsx"
    echo "Deleted: frontend/src/components/lazy/index.tsx"
else
    echo "Not found (skipping): frontend/src/components/lazy/index.tsx"
fi
if [ -f "frontend/src/components/MoneyMaker/index.tsx" ]; then
    git rm -f "frontend/src/components/MoneyMaker/index.tsx"
    echo "Deleted: frontend/src/components/MoneyMaker/index.tsx"
else
    echo "Not found (skipping): frontend/src/components/MoneyMaker/index.tsx"
fi
if [ -f "frontend/src/components/shared/index.tsx" ]; then
    git rm -f "frontend/src/components/shared/index.tsx"
    echo "Deleted: frontend/src/components/shared/index.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/index.tsx"
fi
if [ -f "frontend/src/components/user-friendly/index.tsx" ]; then
    git rm -f "frontend/src/components/user-friendly/index.tsx"
    echo "Deleted: frontend/src/components/user-friendly/index.tsx"
else
    echo "Not found (skipping): frontend/src/components/user-friendly/index.tsx"
fi
if [ -f "frontend/src/index.tsx" ]; then
    git rm -f "frontend/src/index.tsx"
    echo "Deleted: frontend/src/index.tsx"
else
    echo "Not found (skipping): frontend/src/index.tsx"
fi
if [ -f "frontend/src/interfaces/index.tsx" ]; then
    git rm -f "frontend/src/interfaces/index.tsx"
    echo "Deleted: frontend/src/interfaces/index.tsx"
else
    echo "Not found (skipping): frontend/src/interfaces/index.tsx"
fi
if [ -f "frontend/src/pages/index.tsx" ]; then
    git rm -f "frontend/src/pages/index.tsx"
    echo "Deleted: frontend/src/pages/index.tsx"
else
    echo "Not found (skipping): frontend/src/pages/index.tsx"
fi
if [ -f "tmp/index.tsx" ]; then
    git rm -f "tmp/index.tsx"
    echo "Deleted: tmp/index.tsx"
else
    echo "Not found (skipping): tmp/index.tsx"
fi
if [ -f "app/ConcurrentFeaturesProvider.tsx" ]; then
    git rm -f "app/ConcurrentFeaturesProvider.tsx"
    echo "Deleted: app/ConcurrentFeaturesProvider.tsx"
else
    echo "Not found (skipping): app/ConcurrentFeaturesProvider.tsx"
fi
if [ -f "app/ModernStateProvider.tsx" ]; then
    git rm -f "app/ModernStateProvider.tsx"
    echo "Deleted: app/ModernStateProvider.tsx"
else
    echo "Not found (skipping): app/ModernStateProvider.tsx"
fi
if [ -f "frontend/src/contexts/AuthContext.tsx" ]; then
    git rm -f "frontend/src/contexts/AuthContext.tsx"
    echo "Deleted: frontend/src/contexts/AuthContext.tsx"
else
    echo "Not found (skipping): frontend/src/contexts/AuthContext.tsx"
fi
if [ -f "frontend/src/contexts/__mocks__/AuthContext.tsx" ]; then
    git rm -f "frontend/src/contexts/__mocks__/AuthContext.tsx"
    echo "Deleted: frontend/src/contexts/__mocks__/AuthContext.tsx"
else
    echo "Not found (skipping): frontend/src/contexts/__mocks__/AuthContext.tsx"
fi
if [ -f "AuthContext.tsx" ]; then
    git rm -f "AuthContext.tsx"
    echo "Deleted: AuthContext.tsx"
else
    echo "Not found (skipping): AuthContext.tsx"
fi
if [ -f "frontend/src/components/AllFeatures.test.tsx" ]; then
    git rm -f "frontend/src/components/AllFeatures.test.tsx"
    echo "Deleted: frontend/src/components/AllFeatures.test.tsx"
else
    echo "Not found (skipping): frontend/src/components/AllFeatures.test.tsx"
fi
if [ -f "frontend/src/test/integration/AllFeatures.test.tsx" ]; then
    git rm -f "frontend/src/test/integration/AllFeatures.test.tsx"
    echo "Deleted: frontend/src/test/integration/AllFeatures.test.tsx"
else
    echo "Not found (skipping): frontend/src/test/integration/AllFeatures.test.tsx"
fi
if [ -f "tmp/ApiDebug.tsx" ]; then
    git rm -f "tmp/ApiDebug.tsx"
    echo "Deleted: tmp/ApiDebug.tsx"
else
    echo "Not found (skipping): tmp/ApiDebug.tsx"
fi
if [ -f "tmp/ApiErrorBoundary.tsx" ]; then
    git rm -f "tmp/ApiErrorBoundary.tsx"
    echo "Deleted: tmp/ApiErrorBoundary.tsx"
else
    echo "Not found (skipping): tmp/ApiErrorBoundary.tsx"
fi
if [ -f "frontend/src/components/core/AppInitializer.tsx" ]; then
    git rm -f "frontend/src/components/core/AppInitializer.tsx"
    echo "Deleted: frontend/src/components/core/AppInitializer.tsx"
else
    echo "Not found (skipping): frontend/src/components/core/AppInitializer.tsx"
fi
if [ -f "tmp/AppInitializer.tsx" ]; then
    git rm -f "tmp/AppInitializer.tsx"
    echo "Deleted: tmp/AppInitializer.tsx"
else
    echo "Not found (skipping): tmp/AppInitializer.tsx"
fi
if [ -f "tmp/ArbitragePage.test.tsx" ]; then
    git rm -f "tmp/ArbitragePage.test.tsx"
    echo "Deleted: tmp/ArbitragePage.test.tsx"
else
    echo "Not found (skipping): tmp/ArbitragePage.test.tsx"
fi
if [ -f "tmp/ArbitragePage.tsx" ]; then
    git rm -f "tmp/ArbitragePage.tsx"
    echo "Deleted: tmp/ArbitragePage.tsx"
else
    echo "Not found (skipping): tmp/ArbitragePage.tsx"
fi
if [ -f "frontend/src/layouts/AuthLayout.tsx" ]; then
    git rm -f "frontend/src/layouts/AuthLayout.tsx"
    echo "Deleted: frontend/src/layouts/AuthLayout.tsx"
else
    echo "Not found (skipping): frontend/src/layouts/AuthLayout.tsx"
fi
if [ -f "tmp/AuthLayout.tsx" ]; then
    git rm -f "tmp/AuthLayout.tsx"
    echo "Deleted: tmp/AuthLayout.tsx"
else
    echo "Not found (skipping): tmp/AuthLayout.tsx"
fi
if [ -f "frontend/src/providers/AuthProvider.tsx" ]; then
    git rm -f "frontend/src/providers/AuthProvider.tsx"
    echo "Deleted: frontend/src/providers/AuthProvider.tsx"
else
    echo "Not found (skipping): frontend/src/providers/AuthProvider.tsx"
fi
if [ -f "tmp/AuthProvider.tsx" ]; then
    git rm -f "tmp/AuthProvider.tsx"
    echo "Deleted: tmp/AuthProvider.tsx"
else
    echo "Not found (skipping): tmp/AuthProvider.tsx"
fi
if [ -f "AuthProvider.tsx" ]; then
    git rm -f "AuthProvider.tsx"
    echo "Deleted: AuthProvider.tsx"
else
    echo "Not found (skipping): AuthProvider.tsx"
fi
if [ -f "frontend/src/components/debug/BackendConnectionTest.tsx" ]; then
    git rm -f "frontend/src/components/debug/BackendConnectionTest.tsx"
    echo "Deleted: frontend/src/components/debug/BackendConnectionTest.tsx"
else
    echo "Not found (skipping): frontend/src/components/debug/BackendConnectionTest.tsx"
fi
if [ -f "tmp/BackendConnectionTest.tsx" ]; then
    git rm -f "tmp/BackendConnectionTest.tsx"
    echo "Deleted: tmp/BackendConnectionTest.tsx"
else
    echo "Not found (skipping): tmp/BackendConnectionTest.tsx"
fi
if [ -f "frontend/src/components/features/user/BankrollManager.tsx" ]; then
    git rm -f "frontend/src/components/features/user/BankrollManager.tsx"
    echo "Deleted: frontend/src/components/features/user/BankrollManager.tsx"
else
    echo "Not found (skipping): frontend/src/components/features/user/BankrollManager.tsx"
fi
if [ -f "frontend/src/components/BankrollManager.tsx" ]; then
    git rm -f "frontend/src/components/BankrollManager.tsx"
    echo "Deleted: frontend/src/components/BankrollManager.tsx"
else
    echo "Not found (skipping): frontend/src/components/BankrollManager.tsx"
fi
if [ -f "tmp/BankrollManager.tsx" ]; then
    git rm -f "tmp/BankrollManager.tsx"
    echo "Deleted: tmp/BankrollManager.tsx"
else
    echo "Not found (skipping): tmp/BankrollManager.tsx"
fi
if [ -f "tmp/BankrollPage.test.tsx" ]; then
    git rm -f "tmp/BankrollPage.test.tsx"
    echo "Deleted: tmp/BankrollPage.test.tsx"
else
    echo "Not found (skipping): tmp/BankrollPage.test.tsx"
fi
if [ -f "frontend/src/components/betting/BetSlip.tsx" ]; then
    git rm -f "frontend/src/components/betting/BetSlip.tsx"
    echo "Deleted: frontend/src/components/betting/BetSlip.tsx"
else
    echo "Not found (skipping): frontend/src/components/betting/BetSlip.tsx"
fi
if [ -f "frontend/src/components/BettingOpportunities.tsx" ]; then
    git rm -f "frontend/src/components/BettingOpportunities.tsx"
    echo "Deleted: frontend/src/components/BettingOpportunities.tsx"
else
    echo "Not found (skipping): frontend/src/components/BettingOpportunities.tsx"
fi
if [ -f "frontend/src/components/betting/BettingOpportunities.tsx" ]; then
    git rm -f "frontend/src/components/betting/BettingOpportunities.tsx"
    echo "Deleted: frontend/src/components/betting/BettingOpportunities.tsx"
else
    echo "Not found (skipping): frontend/src/components/betting/BettingOpportunities.tsx"
fi
if [ -f "frontend/src/components/predictions/BettingOpportunities.tsx" ]; then
    git rm -f "frontend/src/components/predictions/BettingOpportunities.tsx"
    echo "Deleted: frontend/src/components/predictions/BettingOpportunities.tsx"
else
    echo "Not found (skipping): frontend/src/components/predictions/BettingOpportunities.tsx"
fi
if [ -f "tmp/BettingOpportunities.tsx" ]; then
    git rm -f "tmp/BettingOpportunities.tsx"
    echo "Deleted: tmp/BettingOpportunities.tsx"
else
    echo "Not found (skipping): tmp/BettingOpportunities.tsx"
fi
if [ -f "frontend/src/components/BettingStats.tsx" ]; then
    git rm -f "frontend/src/components/BettingStats.tsx"
    echo "Deleted: frontend/src/components/BettingStats.tsx"
else
    echo "Not found (skipping): frontend/src/components/BettingStats.tsx"
fi
if [ -f "frontend/src/components/betting/BettingStats.tsx" ]; then
    git rm -f "frontend/src/components/betting/BettingStats.tsx"
    echo "Deleted: frontend/src/components/betting/BettingStats.tsx"
else
    echo "Not found (skipping): frontend/src/components/betting/BettingStats.tsx"
fi
if [ -f "tmp/BettingStats.tsx" ]; then
    git rm -f "tmp/BettingStats.tsx"
    echo "Deleted: tmp/BettingStats.tsx"
else
    echo "Not found (skipping): tmp/BettingStats.tsx"
fi
if [ -f "tmp/BookmakerAnalysis.tsx" ]; then
    git rm -f "tmp/BookmakerAnalysis.tsx"
    echo "Deleted: tmp/BookmakerAnalysis.tsx"
else
    echo "Not found (skipping): tmp/BookmakerAnalysis.tsx"
fi
if [ -f "frontend/src/components/ConfidenceIndicator.jsx" ]; then
    git rm -f "frontend/src/components/ConfidenceIndicator.jsx"
    echo "Deleted: frontend/src/components/ConfidenceIndicator.jsx"
else
    echo "Not found (skipping): frontend/src/components/ConfidenceIndicator.jsx"
fi
if [ -f "frontend/src/components/ConfidenceIndicator.tsx" ]; then
    git rm -f "frontend/src/components/ConfidenceIndicator.tsx"
    echo "Deleted: frontend/src/components/ConfidenceIndicator.tsx"
else
    echo "Not found (skipping): frontend/src/components/ConfidenceIndicator.tsx"
fi
if [ -f "frontend/src/components/predictions/ConfidenceIndicator.tsx" ]; then
    git rm -f "frontend/src/components/predictions/ConfidenceIndicator.tsx"
    echo "Deleted: frontend/src/components/predictions/ConfidenceIndicator.tsx"
else
    echo "Not found (skipping): frontend/src/components/predictions/ConfidenceIndicator.tsx"
fi
if [ -f "frontend/src/components/shared/common/ConfidenceIndicator.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/ConfidenceIndicator.tsx"
    echo "Deleted: frontend/src/components/shared/common/ConfidenceIndicator.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/ConfidenceIndicator.tsx"
fi
if [ -f "tmp/ConfidenceIndicator.tsx" ]; then
    git rm -f "tmp/ConfidenceIndicator.tsx"
    echo "Deleted: tmp/ConfidenceIndicator.tsx"
else
    echo "Not found (skipping): tmp/ConfidenceIndicator.tsx"
fi
if [ -f "tmp/ConnectionStatus.tsx" ]; then
    git rm -f "tmp/ConnectionStatus.tsx"
    echo "Deleted: tmp/ConnectionStatus.tsx"
else
    echo "Not found (skipping): tmp/ConnectionStatus.tsx"
fi
if [ -f "tmp/ConnectionTest.tsx" ]; then
    git rm -f "tmp/ConnectionTest.tsx"
    echo "Deleted: tmp/ConnectionTest.tsx"
else
    echo "Not found (skipping): tmp/ConnectionTest.tsx"
fi
if [ -f "tmp/DebugApiStatus.tsx" ]; then
    git rm -f "tmp/DebugApiStatus.tsx"
    echo "Deleted: tmp/DebugApiStatus.tsx"
else
    echo "Not found (skipping): tmp/DebugApiStatus.tsx"
fi
if [ -f "tmp/DebugPanel.tsx" ]; then
    git rm -f "tmp/DebugPanel.tsx"
    echo "Deleted: tmp/DebugPanel.tsx"
else
    echo "Not found (skipping): tmp/DebugPanel.tsx"
fi
if [ -f "tmp/DevelopmentGuide.tsx" ]; then
    git rm -f "tmp/DevelopmentGuide.tsx"
    echo "Deleted: tmp/DevelopmentGuide.tsx"
else
    echo "Not found (skipping): tmp/DevelopmentGuide.tsx"
fi
if [ -f "frontend/src/components/EnhancedDashboard.tsx" ]; then
    git rm -f "frontend/src/components/EnhancedDashboard.tsx"
    echo "Deleted: frontend/src/components/EnhancedDashboard.tsx"
else
    echo "Not found (skipping): frontend/src/components/EnhancedDashboard.tsx"
fi
if [ -f "frontend/src/components/shared/EnhancedErrorBoundary.tsx" ]; then
    git rm -f "frontend/src/components/shared/EnhancedErrorBoundary.tsx"
    echo "Deleted: frontend/src/components/shared/EnhancedErrorBoundary.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/EnhancedErrorBoundary.tsx"
fi
if [ -f "frontend/src/components/shared/EnhancedPropCard.tsx" ]; then
    git rm -f "frontend/src/components/shared/EnhancedPropCard.tsx"
    echo "Deleted: frontend/src/components/shared/EnhancedPropCard.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/EnhancedPropCard.tsx"
fi
if [ -f "tmp/EntryCard.tsx" ]; then
    git rm -f "tmp/EntryCard.tsx"
    echo "Deleted: tmp/EntryCard.tsx"
else
    echo "Not found (skipping): tmp/EntryCard.tsx"
fi
if [ -f "frontend/src/components/shared/feedback/ErrorFallback.tsx" ]; then
    git rm -f "frontend/src/components/shared/feedback/ErrorFallback.tsx"
    echo "Deleted: frontend/src/components/shared/feedback/ErrorFallback.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/feedback/ErrorFallback.tsx"
fi
if [ -f "tmp/ErrorFallback.tsx" ]; then
    git rm -f "tmp/ErrorFallback.tsx"
    echo "Deleted: tmp/ErrorFallback.tsx"
else
    echo "Not found (skipping): tmp/ErrorFallback.tsx"
fi
if [ -f "frontend/src/components/features/news/ESPNHeadlinesTicker.tsx" ]; then
    git rm -f "frontend/src/components/features/news/ESPNHeadlinesTicker.tsx"
    echo "Deleted: frontend/src/components/features/news/ESPNHeadlinesTicker.tsx"
else
    echo "Not found (skipping): frontend/src/components/features/news/ESPNHeadlinesTicker.tsx"
fi
if [ -f "frontend/src/components/ESPNHeadlinesTicker.tsx" ]; then
    git rm -f "frontend/src/components/ESPNHeadlinesTicker.tsx"
    echo "Deleted: frontend/src/components/ESPNHeadlinesTicker.tsx"
else
    echo "Not found (skipping): frontend/src/components/ESPNHeadlinesTicker.tsx"
fi
if [ -f "tmp/ESPNHeadlinesTicker.tsx" ]; then
    git rm -f "tmp/ESPNHeadlinesTicker.tsx"
    echo "Deleted: tmp/ESPNHeadlinesTicker.tsx"
else
    echo "Not found (skipping): tmp/ESPNHeadlinesTicker.tsx"
fi
if [ -f "tmp/featureCoverage.test.tsx" ]; then
    git rm -f "tmp/featureCoverage.test.tsx"
    echo "Deleted: tmp/featureCoverage.test.tsx"
else
    echo "Not found (skipping): tmp/featureCoverage.test.tsx"
fi
if [ -f "frontend/src/test/featureCoverage.test.tsx" ]; then
    git rm -f "frontend/src/test/featureCoverage.test.tsx"
    echo "Deleted: frontend/src/test/featureCoverage.test.tsx"
else
    echo "Not found (skipping): frontend/src/test/featureCoverage.test.tsx"
fi
if [ -f "tmp/FeatureStatusPanel.tsx" ]; then
    git rm -f "tmp/FeatureStatusPanel.tsx"
    echo "Deleted: tmp/FeatureStatusPanel.tsx"
else
    echo "Not found (skipping): tmp/FeatureStatusPanel.tsx"
fi
if [ -f "frontend/src/components/shared/common/FilterBar.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/FilterBar.tsx"
    echo "Deleted: frontend/src/components/shared/common/FilterBar.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/FilterBar.tsx"
fi
if [ -f "tmp/FilterBar.tsx" ]; then
    git rm -f "tmp/FilterBar.tsx"
    echo "Deleted: tmp/FilterBar.tsx"
else
    echo "Not found (skipping): tmp/FilterBar.tsx"
fi
if [ -f "frontend/src/components/Header.tsx" ]; then
    git rm -f "frontend/src/components/Header.tsx"
    echo "Deleted: frontend/src/components/Header.tsx"
else
    echo "Not found (skipping): frontend/src/components/Header.tsx"
fi
if [ -f "tmp/Header.tsx" ]; then
    git rm -f "tmp/Header.tsx"
    echo "Deleted: tmp/Header.tsx"
else
    echo "Not found (skipping): tmp/Header.tsx"
fi
if [ -f "frontend/src/components/InjuryTracker.tsx" ]; then
    git rm -f "frontend/src/components/InjuryTracker.tsx"
    echo "Deleted: frontend/src/components/InjuryTracker.tsx"
else
    echo "Not found (skipping): frontend/src/components/InjuryTracker.tsx"
fi
if [ -f "tmp/IntegrationStatus.tsx" ]; then
    git rm -f "tmp/IntegrationStatus.tsx"
    echo "Deleted: tmp/IntegrationStatus.tsx"
else
    echo "Not found (skipping): tmp/IntegrationStatus.tsx"
fi
if [ -f "frontend/src/components/LineupBuilder.tsx" ]; then
    git rm -f "frontend/src/components/LineupBuilder.tsx"
    echo "Deleted: frontend/src/components/LineupBuilder.tsx"
else
    echo "Not found (skipping): frontend/src/components/LineupBuilder.tsx"
fi
if [ -f "tmp/LineupComparisonTable.tsx" ]; then
    git rm -f "tmp/LineupComparisonTable.tsx"
    echo "Deleted: tmp/LineupComparisonTable.tsx"
else
    echo "Not found (skipping): tmp/LineupComparisonTable.tsx"
fi
if [ -f "frontend/src/components/betting/LiveOddsTicker.tsx" ]; then
    git rm -f "frontend/src/components/betting/LiveOddsTicker.tsx"
    echo "Deleted: frontend/src/components/betting/LiveOddsTicker.tsx"
else
    echo "Not found (skipping): frontend/src/components/betting/LiveOddsTicker.tsx"
fi
if [ -f "tmp/LiveOddsTicker.tsx" ]; then
    git rm -f "tmp/LiveOddsTicker.tsx"
    echo "Deleted: tmp/LiveOddsTicker.tsx"
else
    echo "Not found (skipping): tmp/LiveOddsTicker.tsx"
fi
if [ -f "frontend/src/components/shared/LoadingOverlay.tsx" ]; then
    git rm -f "frontend/src/components/shared/LoadingOverlay.tsx"
    echo "Deleted: frontend/src/components/shared/LoadingOverlay.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/LoadingOverlay.tsx"
fi
if [ -f "frontend/src/components/core/LoadingScreen.tsx" ]; then
    git rm -f "frontend/src/components/core/LoadingScreen.tsx"
    echo "Deleted: frontend/src/components/core/LoadingScreen.tsx"
else
    echo "Not found (skipping): frontend/src/components/core/LoadingScreen.tsx"
fi
if [ -f "tmp/LoadingScreen.tsx" ]; then
    git rm -f "tmp/LoadingScreen.tsx"
    echo "Deleted: tmp/LoadingScreen.tsx"
else
    echo "Not found (skipping): tmp/LoadingScreen.tsx"
fi
if [ -f "frontend/src/components/auth/LoginForm.tsx" ]; then
    git rm -f "frontend/src/components/auth/LoginForm.tsx"
    echo "Deleted: frontend/src/components/auth/LoginForm.tsx"
else
    echo "Not found (skipping): frontend/src/components/auth/LoginForm.tsx"
fi
if [ -f "tmp/LoginForm.tsx" ]; then
    git rm -f "tmp/LoginForm.tsx"
    echo "Deleted: tmp/LoginForm.tsx"
else
    echo "Not found (skipping): tmp/LoginForm.tsx"
fi
if [ -f "tmp/MarketAnalysisDashboard.tsx" ]; then
    git rm -f "tmp/MarketAnalysisDashboard.tsx"
    echo "Deleted: tmp/MarketAnalysisDashboard.tsx"
else
    echo "Not found (skipping): tmp/MarketAnalysisDashboard.tsx"
fi
if [ -f "frontend/src/components/MLFactorViz.tsx" ]; then
    git rm -f "frontend/src/components/MLFactorViz.tsx"
    echo "Deleted: frontend/src/components/MLFactorViz.tsx"
else
    echo "Not found (skipping): frontend/src/components/MLFactorViz.tsx"
fi
if [ -f "tmp/MLFactorViz.tsx" ]; then
    git rm -f "tmp/MLFactorViz.tsx"
    echo "Deleted: tmp/MLFactorViz.tsx"
else
    echo "Not found (skipping): tmp/MLFactorViz.tsx"
fi
if [ -f "tmp/MLPredictions.tsx" ]; then
    git rm -f "tmp/MLPredictions.tsx"
    echo "Deleted: tmp/MLPredictions.tsx"
else
    echo "Not found (skipping): tmp/MLPredictions.tsx"
fi
if [ -f "frontend/src/components/ModelPerformance.tsx" ]; then
    git rm -f "frontend/src/components/ModelPerformance.tsx"
    echo "Deleted: frontend/src/components/ModelPerformance.tsx"
else
    echo "Not found (skipping): frontend/src/components/ModelPerformance.tsx"
fi
if [ -f "frontend/src/components/predictions/ModelPerformance.tsx" ]; then
    git rm -f "frontend/src/components/predictions/ModelPerformance.tsx"
    echo "Deleted: frontend/src/components/predictions/ModelPerformance.tsx"
else
    echo "Not found (skipping): frontend/src/components/predictions/ModelPerformance.tsx"
fi
if [ -f "tmp/ModelPerformance.tsx" ]; then
    git rm -f "tmp/ModelPerformance.tsx"
    echo "Deleted: tmp/ModelPerformance.tsx"
else
    echo "Not found (skipping): tmp/ModelPerformance.tsx"
fi
if [ -f "frontend/src/components/NewsHub.tsx" ]; then
    git rm -f "frontend/src/components/NewsHub.tsx"
    echo "Deleted: frontend/src/components/NewsHub.tsx"
else
    echo "Not found (skipping): frontend/src/components/NewsHub.tsx"
fi
if [ -f "tmp/NoResultsFallback.tsx" ]; then
    git rm -f "tmp/NoResultsFallback.tsx"
    echo "Deleted: tmp/NoResultsFallback.tsx"
else
    echo "Not found (skipping): tmp/NoResultsFallback.tsx"
fi
if [ -f "tmp/OllamaStatus.tsx" ]; then
    git rm -f "tmp/OllamaStatus.tsx"
    echo "Deleted: tmp/OllamaStatus.tsx"
else
    echo "Not found (skipping): tmp/OllamaStatus.tsx"
fi
if [ -f "frontend/src/components/PatternRecognition.tsx" ]; then
    git rm -f "frontend/src/components/PatternRecognition.tsx"
    echo "Deleted: frontend/src/components/PatternRecognition.tsx"
else
    echo "Not found (skipping): frontend/src/components/PatternRecognition.tsx"
fi
if [ -f "tmp/PatternRecognition.tsx" ]; then
    git rm -f "tmp/PatternRecognition.tsx"
    echo "Deleted: tmp/PatternRecognition.tsx"
else
    echo "Not found (skipping): tmp/PatternRecognition.tsx"
fi
if [ -f "tmp/PayoutPreview.test.tsx" ]; then
    git rm -f "tmp/PayoutPreview.test.tsx"
    echo "Deleted: tmp/PayoutPreview.test.tsx"
else
    echo "Not found (skipping): tmp/PayoutPreview.test.tsx"
fi
if [ -f "frontend/src/components/betting/PayoutPreview.tsx" ]; then
    git rm -f "frontend/src/components/betting/PayoutPreview.tsx"
    echo "Deleted: frontend/src/components/betting/PayoutPreview.tsx"
else
    echo "Not found (skipping): frontend/src/components/betting/PayoutPreview.tsx"
fi
if [ -f "frontend/src/components/lineup/PayoutPreview.tsx" ]; then
    git rm -f "frontend/src/components/lineup/PayoutPreview.tsx"
    echo "Deleted: frontend/src/components/lineup/PayoutPreview.tsx"
else
    echo "Not found (skipping): frontend/src/components/lineup/PayoutPreview.tsx"
fi
if [ -f "frontend/src/components/prediction/PayoutPreview.tsx" ]; then
    git rm -f "frontend/src/components/prediction/PayoutPreview.tsx"
    echo "Deleted: frontend/src/components/prediction/PayoutPreview.tsx"
else
    echo "Not found (skipping): frontend/src/components/prediction/PayoutPreview.tsx"
fi
if [ -f "tmp/PayoutPreview.tsx" ]; then
    git rm -f "tmp/PayoutPreview.tsx"
    echo "Deleted: tmp/PayoutPreview.tsx"
else
    echo "Not found (skipping): tmp/PayoutPreview.tsx"
fi
if [ -f "frontend/src/components/PerformanceAnalytics.tsx" ]; then
    git rm -f "frontend/src/components/PerformanceAnalytics.tsx"
    echo "Deleted: frontend/src/components/PerformanceAnalytics.tsx"
else
    echo "Not found (skipping): frontend/src/components/PerformanceAnalytics.tsx"
fi
if [ -f "tmp/PerformanceAnalytics.tsx" ]; then
    git rm -f "tmp/PerformanceAnalytics.tsx"
    echo "Deleted: tmp/PerformanceAnalytics.tsx"
else
    echo "Not found (skipping): tmp/PerformanceAnalytics.tsx"
fi
if [ -f "frontend/src/components/PerformanceMetrics.tsx" ]; then
    git rm -f "frontend/src/components/PerformanceMetrics.tsx"
    echo "Deleted: frontend/src/components/PerformanceMetrics.tsx"
else
    echo "Not found (skipping): frontend/src/components/PerformanceMetrics.tsx"
fi
if [ -f "frontend/src/components/betting/PerformanceMetrics.tsx" ]; then
    git rm -f "frontend/src/components/betting/PerformanceMetrics.tsx"
    echo "Deleted: frontend/src/components/betting/PerformanceMetrics.tsx"
else
    echo "Not found (skipping): frontend/src/components/betting/PerformanceMetrics.tsx"
fi
if [ -f "frontend/src/components/observability/PerformanceMetrics.tsx" ]; then
    git rm -f "frontend/src/components/observability/PerformanceMetrics.tsx"
    echo "Deleted: frontend/src/components/observability/PerformanceMetrics.tsx"
else
    echo "Not found (skipping): frontend/src/components/observability/PerformanceMetrics.tsx"
fi
if [ -f "tmp/PerformanceMetrics.tsx" ]; then
    git rm -f "tmp/PerformanceMetrics.tsx"
    echo "Deleted: tmp/PerformanceMetrics.tsx"
else
    echo "Not found (skipping): tmp/PerformanceMetrics.tsx"
fi
if [ -f "frontend/src/components/PerformanceMonitor.tsx" ]; then
    git rm -f "frontend/src/components/PerformanceMonitor.tsx"
    echo "Deleted: frontend/src/components/PerformanceMonitor.tsx"
else
    echo "Not found (skipping): frontend/src/components/PerformanceMonitor.tsx"
fi
if [ -f "tmp/PerformanceMonitor.tsx" ]; then
    git rm -f "tmp/PerformanceMonitor.tsx"
    echo "Deleted: tmp/PerformanceMonitor.tsx"
else
    echo "Not found (skipping): tmp/PerformanceMonitor.tsx"
fi
if [ -f "frontend/src/components/phase4/PerformanceMonitoringDashboard.tsx" ]; then
    git rm -f "frontend/src/components/phase4/PerformanceMonitoringDashboard.tsx"
    echo "Deleted: frontend/src/components/phase4/PerformanceMonitoringDashboard.tsx"
else
    echo "Not found (skipping): frontend/src/components/phase4/PerformanceMonitoringDashboard.tsx"
fi
if [ -f "frontend/src/components/player/PlayerDashboard.tsx" ]; then
    git rm -f "frontend/src/components/player/PlayerDashboard.tsx"
    echo "Deleted: frontend/src/components/player/PlayerDashboard.tsx"
else
    echo "Not found (skipping): frontend/src/components/player/PlayerDashboard.tsx"
fi
if [ -f "frontend/src/components/PredictionDisplay.tsx" ]; then
    git rm -f "frontend/src/components/PredictionDisplay.tsx"
    echo "Deleted: frontend/src/components/PredictionDisplay.tsx"
else
    echo "Not found (skipping): frontend/src/components/PredictionDisplay.tsx"
fi
if [ -f "frontend/src/components/prediction/PredictionDisplay.tsx" ]; then
    git rm -f "frontend/src/components/prediction/PredictionDisplay.tsx"
    echo "Deleted: frontend/src/components/prediction/PredictionDisplay.tsx"
else
    echo "Not found (skipping): frontend/src/components/prediction/PredictionDisplay.tsx"
fi
if [ -f "tmp/PredictionDisplay.tsx" ]; then
    git rm -f "tmp/PredictionDisplay.tsx"
    echo "Deleted: tmp/PredictionDisplay.tsx"
else
    echo "Not found (skipping): tmp/PredictionDisplay.tsx"
fi
if [ -f "frontend/src/components/PredictionEnhancement.tsx" ]; then
    git rm -f "frontend/src/components/PredictionEnhancement.tsx"
    echo "Deleted: frontend/src/components/PredictionEnhancement.tsx"
else
    echo "Not found (skipping): frontend/src/components/PredictionEnhancement.tsx"
fi
if [ -f "tmp/PredictionEnhancement.tsx" ]; then
    git rm -f "tmp/PredictionEnhancement.tsx"
    echo "Deleted: tmp/PredictionEnhancement.tsx"
else
    echo "Not found (skipping): tmp/PredictionEnhancement.tsx"
fi
if [ -f "tmp/PropAnalysis.tsx" ]; then
    git rm -f "tmp/PropAnalysis.tsx"
    echo "Deleted: tmp/PropAnalysis.tsx"
else
    echo "Not found (skipping): tmp/PropAnalysis.tsx"
fi
if [ -f "frontend/src/components/features/betting/PropCard.tsx" ]; then
    git rm -f "frontend/src/components/features/betting/PropCard.tsx"
    echo "Deleted: frontend/src/components/features/betting/PropCard.tsx"
else
    echo "Not found (skipping): frontend/src/components/features/betting/PropCard.tsx"
fi
if [ -f "frontend/src/components/PropCard.tsx" ]; then
    git rm -f "frontend/src/components/PropCard.tsx"
    echo "Deleted: frontend/src/components/PropCard.tsx"
else
    echo "Not found (skipping): frontend/src/components/PropCard.tsx"
fi
if [ -f "frontend/src/components/shared/PropCard.tsx" ]; then
    git rm -f "frontend/src/components/shared/PropCard.tsx"
    echo "Deleted: frontend/src/components/shared/PropCard.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/PropCard.tsx"
fi
if [ -f "tmp/PropCard.tsx" ]; then
    git rm -f "tmp/PropCard.tsx"
    echo "Deleted: tmp/PropCard.tsx"
else
    echo "Not found (skipping): tmp/PropCard.tsx"
fi
if [ -f "frontend/src/components/features/betting/PropCards.tsx" ]; then
    git rm -f "frontend/src/components/features/betting/PropCards.tsx"
    echo "Deleted: frontend/src/components/features/betting/PropCards.tsx"
else
    echo "Not found (skipping): frontend/src/components/features/betting/PropCards.tsx"
fi
if [ -f "frontend/src/components/PropCards.tsx" ]; then
    git rm -f "frontend/src/components/PropCards.tsx"
    echo "Deleted: frontend/src/components/PropCards.tsx"
else
    echo "Not found (skipping): frontend/src/components/PropCards.tsx"
fi
if [ -f "tmp/PropCards.tsx" ]; then
    git rm -f "tmp/PropCards.tsx"
    echo "Deleted: tmp/PropCards.tsx"
else
    echo "Not found (skipping): tmp/PropCards.tsx"
fi
if [ -f "tmp/PropGPT.tsx" ]; then
    git rm -f "tmp/PropGPT.tsx"
    echo "Deleted: tmp/PropGPT.tsx"
else
    echo "Not found (skipping): tmp/PropGPT.tsx"
fi
if [ -f "frontend/src/components/lists/PropList.tsx" ]; then
    git rm -f "frontend/src/components/lists/PropList.tsx"
    echo "Deleted: frontend/src/components/lists/PropList.tsx"
else
    echo "Not found (skipping): frontend/src/components/lists/PropList.tsx"
fi
if [ -f "tmp/PropList.tsx" ]; then
    git rm -f "tmp/PropList.tsx"
    echo "Deleted: tmp/PropList.tsx"
else
    echo "Not found (skipping): tmp/PropList.tsx"
fi
if [ -f "frontend/src/components/QuantumAI.tsx" ]; then
    git rm -f "frontend/src/components/QuantumAI.tsx"
    echo "Deleted: frontend/src/components/QuantumAI.tsx"
else
    echo "Not found (skipping): frontend/src/components/QuantumAI.tsx"
fi
if [ -f "frontend/src/components/RealtimePredictionDisplay.tsx" ]; then
    git rm -f "frontend/src/components/RealtimePredictionDisplay.tsx"
    echo "Deleted: frontend/src/components/RealtimePredictionDisplay.tsx"
else
    echo "Not found (skipping): frontend/src/components/RealtimePredictionDisplay.tsx"
fi
if [ -f "frontend/src/components/predictions/RealtimePredictionDisplay.tsx" ]; then
    git rm -f "frontend/src/components/predictions/RealtimePredictionDisplay.tsx"
    echo "Deleted: frontend/src/components/predictions/RealtimePredictionDisplay.tsx"
else
    echo "Not found (skipping): frontend/src/components/predictions/RealtimePredictionDisplay.tsx"
fi
if [ -f "tmp/RealtimePredictionDisplay.tsx" ]; then
    git rm -f "tmp/RealtimePredictionDisplay.tsx"
    echo "Deleted: tmp/RealtimePredictionDisplay.tsx"
else
    echo "Not found (skipping): tmp/RealtimePredictionDisplay.tsx"
fi
if [ -f "tmp/RealTimeUpdates.tsx" ]; then
    git rm -f "tmp/RealTimeUpdates.tsx"
    echo "Deleted: tmp/RealTimeUpdates.tsx"
else
    echo "Not found (skipping): tmp/RealTimeUpdates.tsx"
fi
if [ -f "frontend/src/components/auth/RegisterForm.tsx" ]; then
    git rm -f "frontend/src/components/auth/RegisterForm.tsx"
    echo "Deleted: frontend/src/components/auth/RegisterForm.tsx"
else
    echo "Not found (skipping): frontend/src/components/auth/RegisterForm.tsx"
fi
if [ -f "tmp/RegisterForm.tsx" ]; then
    git rm -f "tmp/RegisterForm.tsx"
    echo "Deleted: tmp/RegisterForm.tsx"
else
    echo "Not found (skipping): tmp/RegisterForm.tsx"
fi
if [ -f "tmp/RiskManagerPage.test.tsx" ]; then
    git rm -f "tmp/RiskManagerPage.test.tsx"
    echo "Deleted: tmp/RiskManagerPage.test.tsx"
else
    echo "Not found (skipping): tmp/RiskManagerPage.test.tsx"
fi
if [ -f "frontend/src/pages/RiskManagerPage.tsx" ]; then
    git rm -f "frontend/src/pages/RiskManagerPage.tsx"
    echo "Deleted: frontend/src/pages/RiskManagerPage.tsx"
else
    echo "Not found (skipping): frontend/src/pages/RiskManagerPage.tsx"
fi
if [ -f "tmp/RiskManagerPage.tsx" ]; then
    git rm -f "tmp/RiskManagerPage.tsx"
    echo "Deleted: tmp/RiskManagerPage.tsx"
else
    echo "Not found (skipping): tmp/RiskManagerPage.tsx"
fi
if [ -f "frontend/src/components/RiskProfileManager.tsx" ]; then
    git rm -f "frontend/src/components/RiskProfileManager.tsx"
    echo "Deleted: frontend/src/components/RiskProfileManager.tsx"
else
    echo "Not found (skipping): frontend/src/components/RiskProfileManager.tsx"
fi
if [ -f "frontend/src/components/risk/RiskProfileManager.tsx" ]; then
    git rm -f "frontend/src/components/risk/RiskProfileManager.tsx"
    echo "Deleted: frontend/src/components/risk/RiskProfileManager.tsx"
else
    echo "Not found (skipping): frontend/src/components/risk/RiskProfileManager.tsx"
fi
if [ -f "tmp/RiskProfileManager.tsx" ]; then
    git rm -f "tmp/RiskProfileManager.tsx"
    echo "Deleted: tmp/RiskProfileManager.tsx"
else
    echo "Not found (skipping): tmp/RiskProfileManager.tsx"
fi
if [ -f "frontend/src/components/RiskProfileSelector.tsx" ]; then
    git rm -f "frontend/src/components/RiskProfileSelector.tsx"
    echo "Deleted: frontend/src/components/RiskProfileSelector.tsx"
else
    echo "Not found (skipping): frontend/src/components/RiskProfileSelector.tsx"
fi
if [ -f "frontend/src/components/betting/RiskProfileSelector.tsx" ]; then
    git rm -f "frontend/src/components/betting/RiskProfileSelector.tsx"
    echo "Deleted: frontend/src/components/betting/RiskProfileSelector.tsx"
else
    echo "Not found (skipping): frontend/src/components/betting/RiskProfileSelector.tsx"
fi
if [ -f "tmp/RiskProfileSelector.tsx" ]; then
    git rm -f "tmp/RiskProfileSelector.tsx"
    echo "Deleted: tmp/RiskProfileSelector.tsx"
else
    echo "Not found (skipping): tmp/RiskProfileSelector.tsx"
fi
if [ -f "frontend/src/components/SHAPAnalysis.tsx" ]; then
    git rm -f "frontend/src/components/SHAPAnalysis.tsx"
    echo "Deleted: frontend/src/components/SHAPAnalysis.tsx"
else
    echo "Not found (skipping): frontend/src/components/SHAPAnalysis.tsx"
fi
if [ -f "frontend/src/components/ShapBreakdownModal.tsx" ]; then
    git rm -f "frontend/src/components/ShapBreakdownModal.tsx"
    echo "Deleted: frontend/src/components/ShapBreakdownModal.tsx"
else
    echo "Not found (skipping): frontend/src/components/ShapBreakdownModal.tsx"
fi
if [ -f "tmp/ShapBreakdownModal.tsx" ]; then
    git rm -f "tmp/ShapBreakdownModal.tsx"
    echo "Deleted: tmp/ShapBreakdownModal.tsx"
else
    echo "Not found (skipping): tmp/ShapBreakdownModal.tsx"
fi
if [ -f "frontend/src/components/ShapValueDisplay.tsx" ]; then
    git rm -f "frontend/src/components/ShapValueDisplay.tsx"
    echo "Deleted: frontend/src/components/ShapValueDisplay.tsx"
else
    echo "Not found (skipping): frontend/src/components/ShapValueDisplay.tsx"
fi
if [ -f "frontend/src/components/predictions/ShapValueDisplay.tsx" ]; then
    git rm -f "frontend/src/components/predictions/ShapValueDisplay.tsx"
    echo "Deleted: frontend/src/components/predictions/ShapValueDisplay.tsx"
else
    echo "Not found (skipping): frontend/src/components/predictions/ShapValueDisplay.tsx"
fi
if [ -f "tmp/ShapValueDisplay.tsx" ]; then
    git rm -f "tmp/ShapValueDisplay.tsx"
    echo "Deleted: tmp/ShapValueDisplay.tsx"
else
    echo "Not found (skipping): tmp/ShapValueDisplay.tsx"
fi
if [ -f "frontend/src/components/ShapVisualization.tsx" ]; then
    git rm -f "frontend/src/components/ShapVisualization.tsx"
    echo "Deleted: frontend/src/components/ShapVisualization.tsx"
else
    echo "Not found (skipping): frontend/src/components/ShapVisualization.tsx"
fi
if [ -f "tmp/SimpleToaster.tsx" ]; then
    git rm -f "tmp/SimpleToaster.tsx"
    echo "Deleted: tmp/SimpleToaster.tsx"
else
    echo "Not found (skipping): tmp/SimpleToaster.tsx"
fi
if [ -f "frontend/src/components/controls/SmartControlsBar.tsx" ]; then
    git rm -f "frontend/src/components/controls/SmartControlsBar.tsx"
    echo "Deleted: frontend/src/components/controls/SmartControlsBar.tsx"
else
    echo "Not found (skipping): frontend/src/components/controls/SmartControlsBar.tsx"
fi
if [ -f "frontend/src/components/shared/SmartControlsBar.tsx" ]; then
    git rm -f "frontend/src/components/shared/SmartControlsBar.tsx"
    echo "Deleted: frontend/src/components/shared/SmartControlsBar.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/SmartControlsBar.tsx"
fi
if [ -f "frontend/src/components/SocialIntelligence.tsx" ]; then
    git rm -f "frontend/src/components/SocialIntelligence.tsx"
    echo "Deleted: frontend/src/components/SocialIntelligence.tsx"
else
    echo "Not found (skipping): frontend/src/components/SocialIntelligence.tsx"
fi
if [ -f "tmp/StrategyAutomationToggle.tsx" ]; then
    git rm -f "tmp/StrategyAutomationToggle.tsx"
    echo "Deleted: tmp/StrategyAutomationToggle.tsx"
else
    echo "Not found (skipping): tmp/StrategyAutomationToggle.tsx"
fi
if [ -f "tmp/ThemeDemo.tsx" ]; then
    git rm -f "tmp/ThemeDemo.tsx"
    echo "Deleted: tmp/ThemeDemo.tsx"
else
    echo "Not found (skipping): tmp/ThemeDemo.tsx"
fi
if [ -f "frontend/src/components/navigation/ThemeToggle.tsx" ]; then
    git rm -f "frontend/src/components/navigation/ThemeToggle.tsx"
    echo "Deleted: frontend/src/components/navigation/ThemeToggle.tsx"
else
    echo "Not found (skipping): frontend/src/components/navigation/ThemeToggle.tsx"
fi
if [ -f "frontend/src/components/shared/common/ThemeToggle.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/ThemeToggle.tsx"
    echo "Deleted: frontend/src/components/shared/common/ThemeToggle.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/ThemeToggle.tsx"
fi
if [ -f "frontend/src/components/ThemeToggle/ThemeToggle.tsx" ]; then
    git rm -f "frontend/src/components/ThemeToggle/ThemeToggle.tsx"
    echo "Deleted: frontend/src/components/ThemeToggle/ThemeToggle.tsx"
else
    echo "Not found (skipping): frontend/src/components/ThemeToggle/ThemeToggle.tsx"
fi
if [ -f "tmp/ThemeToggle.tsx" ]; then
    git rm -f "tmp/ThemeToggle.tsx"
    echo "Deleted: tmp/ThemeToggle.tsx"
else
    echo "Not found (skipping): tmp/ThemeToggle.tsx"
fi
if [ -f "frontend/src/components/shared/feedback/ToastContext.tsx" ]; then
    git rm -f "frontend/src/components/shared/feedback/ToastContext.tsx"
    echo "Deleted: frontend/src/components/shared/feedback/ToastContext.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/feedback/ToastContext.tsx"
fi
if [ -f "tmp/ToastContext.tsx" ]; then
    git rm -f "tmp/ToastContext.tsx"
    echo "Deleted: tmp/ToastContext.tsx"
else
    echo "Not found (skipping): tmp/ToastContext.tsx"
fi
if [ -f "tmp/ToggleSidebar.tsx" ]; then
    git rm -f "tmp/ToggleSidebar.tsx"
    echo "Deleted: tmp/ToggleSidebar.tsx"
else
    echo "Not found (skipping): tmp/ToggleSidebar.tsx"
fi
if [ -f "tmp/TrendingProps.tsx" ]; then
    git rm -f "tmp/TrendingProps.tsx"
    echo "Deleted: tmp/TrendingProps.tsx"
else
    echo "Not found (skipping): tmp/TrendingProps.tsx"
fi
if [ -f "frontend/src/components/UserConstraintsForm.tsx" ]; then
    git rm -f "frontend/src/components/UserConstraintsForm.tsx"
    echo "Deleted: frontend/src/components/UserConstraintsForm.tsx"
else
    echo "Not found (skipping): frontend/src/components/UserConstraintsForm.tsx"
fi
if [ -f "tmp/UserConstraintsForm.tsx" ]; then
    git rm -f "tmp/UserConstraintsForm.tsx"
    echo "Deleted: tmp/UserConstraintsForm.tsx"
else
    echo "Not found (skipping): tmp/UserConstraintsForm.tsx"
fi
if [ -f "frontend/src/components/user-friendly/UserProfile.tsx" ]; then
    git rm -f "frontend/src/components/user-friendly/UserProfile.tsx"
    echo "Deleted: frontend/src/components/user-friendly/UserProfile.tsx"
else
    echo "Not found (skipping): frontend/src/components/user-friendly/UserProfile.tsx"
fi
if [ -f "frontend/src/components/WeatherStation.tsx" ]; then
    git rm -f "frontend/src/components/WeatherStation.tsx"
    echo "Deleted: frontend/src/components/WeatherStation.tsx"
else
    echo "Not found (skipping): frontend/src/components/WeatherStation.tsx"
fi
if [ -f "tmp/WebSocketBatchingAnalytics.tsx" ]; then
    git rm -f "tmp/WebSocketBatchingAnalytics.tsx"
    echo "Deleted: tmp/WebSocketBatchingAnalytics.tsx"
else
    echo "Not found (skipping): tmp/WebSocketBatchingAnalytics.tsx"
fi
if [ -f "tmp/WebSocketLoadBalancerAnalytics.tsx" ]; then
    git rm -f "tmp/WebSocketLoadBalancerAnalytics.tsx"
    echo "Deleted: tmp/WebSocketLoadBalancerAnalytics.tsx"
else
    echo "Not found (skipping): tmp/WebSocketLoadBalancerAnalytics.tsx"
fi
if [ -f "tmp/WebSocketSecurityDashboard.tsx" ]; then
    git rm -f "tmp/WebSocketSecurityDashboard.tsx"
    echo "Deleted: tmp/WebSocketSecurityDashboard.tsx"
else
    echo "Not found (skipping): tmp/WebSocketSecurityDashboard.tsx"
fi
if [ -f "frontend/src/components/shared/common/ErrorBoundary/withErrorBoundary.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/ErrorBoundary/withErrorBoundary.tsx"
    echo "Deleted: frontend/src/components/shared/common/ErrorBoundary/withErrorBoundary.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/ErrorBoundary/withErrorBoundary.tsx"
fi
if [ -f "tmp/withErrorBoundary.tsx" ]; then
    git rm -f "tmp/withErrorBoundary.tsx"
    echo "Deleted: tmp/withErrorBoundary.tsx"
else
    echo "Not found (skipping): tmp/withErrorBoundary.tsx"
fi
if [ -f "tmp/AdminSettings.tsx" ]; then
    git rm -f "tmp/AdminSettings.tsx"
    echo "Deleted: tmp/AdminSettings.tsx"
else
    echo "Not found (skipping): tmp/AdminSettings.tsx"
fi
if [ -f "tmp/ErrorLogs.tsx" ]; then
    git rm -f "tmp/ErrorLogs.tsx"
    echo "Deleted: tmp/ErrorLogs.tsx"
else
    echo "Not found (skipping): tmp/ErrorLogs.tsx"
fi
if [ -f "tmp/ModelSettings.tsx" ]; then
    git rm -f "tmp/ModelSettings.tsx"
    echo "Deleted: tmp/ModelSettings.tsx"
else
    echo "Not found (skipping): tmp/ModelSettings.tsx"
fi
if [ -f "tmp/WhatIfSimulator.tsx" ]; then
    git rm -f "tmp/WhatIfSimulator.tsx"
    echo "Deleted: tmp/WhatIfSimulator.tsx"
else
    echo "Not found (skipping): tmp/WhatIfSimulator.tsx"
fi
if [ -f "tmp/AnalyticsDashboard.test.tsx" ]; then
    git rm -f "tmp/AnalyticsDashboard.test.tsx"
    echo "Deleted: tmp/AnalyticsDashboard.test.tsx"
else
    echo "Not found (skipping): tmp/AnalyticsDashboard.test.tsx"
fi
if [ -f "tmp/ClusteringInsights.tsx" ]; then
    git rm -f "tmp/ClusteringInsights.tsx"
    echo "Deleted: tmp/ClusteringInsights.tsx"
else
    echo "Not found (skipping): tmp/ClusteringInsights.tsx"
fi
if [ -f "tmp/EnsembleInsights.tsx" ]; then
    git rm -f "tmp/EnsembleInsights.tsx"
    echo "Deleted: tmp/EnsembleInsights.tsx"
else
    echo "Not found (skipping): tmp/EnsembleInsights.tsx"
fi
if [ -f "tmp/HyperMLInsights.tsx" ]; then
    git rm -f "tmp/HyperMLInsights.tsx"
    echo "Deleted: tmp/HyperMLInsights.tsx"
else
    echo "Not found (skipping): tmp/HyperMLInsights.tsx"
fi
if [ -f "frontend/src/components/analytics/MLInsights.tsx" ]; then
    git rm -f "frontend/src/components/analytics/MLInsights.tsx"
    echo "Deleted: frontend/src/components/analytics/MLInsights.tsx"
else
    echo "Not found (skipping): frontend/src/components/analytics/MLInsights.tsx"
fi
if [ -f "frontend/src/components/insights/MLInsights.tsx" ]; then
    git rm -f "frontend/src/components/insights/MLInsights.tsx"
    echo "Deleted: frontend/src/components/insights/MLInsights.tsx"
else
    echo "Not found (skipping): frontend/src/components/insights/MLInsights.tsx"
fi
if [ -f "tmp/MLInsights.tsx" ]; then
    git rm -f "tmp/MLInsights.tsx"
    echo "Deleted: tmp/MLInsights.tsx"
else
    echo "Not found (skipping): tmp/MLInsights.tsx"
fi
if [ -f "tmp/ModelComparison.tsx" ]; then
    git rm -f "tmp/ModelComparison.tsx"
    echo "Deleted: tmp/ModelComparison.tsx"
else
    echo "Not found (skipping): tmp/ModelComparison.tsx"
fi
if [ -f "tmp/ModelComparisonChart.tsx" ]; then
    git rm -f "tmp/ModelComparisonChart.tsx"
    echo "Deleted: tmp/ModelComparisonChart.tsx"
else
    echo "Not found (skipping): tmp/ModelComparisonChart.tsx"
fi
if [ -f "tmp/ModelPerformanceDashboard.tsx" ]; then
    git rm -f "tmp/ModelPerformanceDashboard.tsx"
    echo "Deleted: tmp/ModelPerformanceDashboard.tsx"
else
    echo "Not found (skipping): tmp/ModelPerformanceDashboard.tsx"
fi
if [ -f "tmp/PerformanceAlerts.tsx" ]; then
    git rm -f "tmp/PerformanceAlerts.tsx"
    echo "Deleted: tmp/PerformanceAlerts.tsx"
else
    echo "Not found (skipping): tmp/PerformanceAlerts.tsx"
fi
if [ -f "tmp/PerformanceExport.tsx" ]; then
    git rm -f "tmp/PerformanceExport.tsx"
    echo "Deleted: tmp/PerformanceExport.tsx"
else
    echo "Not found (skipping): tmp/PerformanceExport.tsx"
fi
if [ -f "tmp/PredictionConfidenceGraph.tsx" ]; then
    git rm -f "tmp/PredictionConfidenceGraph.tsx"
    echo "Deleted: tmp/PredictionConfidenceGraph.tsx"
else
    echo "Not found (skipping): tmp/PredictionConfidenceGraph.tsx"
fi
if [ -f "tmp/RealTimeAccuracyDashboard.tsx" ]; then
    git rm -f "tmp/RealTimeAccuracyDashboard.tsx"
    echo "Deleted: tmp/RealTimeAccuracyDashboard.tsx"
else
    echo "Not found (skipping): tmp/RealTimeAccuracyDashboard.tsx"
fi
if [ -f "tmp/RealTimeMetrics.tsx" ]; then
    git rm -f "tmp/RealTimeMetrics.tsx"
    echo "Deleted: tmp/RealTimeMetrics.tsx"
else
    echo "Not found (skipping): tmp/RealTimeMetrics.tsx"
fi
if [ -f "tmp/RiskAssessmentMatrix.tsx" ]; then
    git rm -f "tmp/RiskAssessmentMatrix.tsx"
    echo "Deleted: tmp/RiskAssessmentMatrix.tsx"
else
    echo "Not found (skipping): tmp/RiskAssessmentMatrix.tsx"
fi
if [ -f "tmp/RiskInsights.tsx" ]; then
    git rm -f "tmp/RiskInsights.tsx"
    echo "Deleted: tmp/RiskInsights.tsx"
else
    echo "Not found (skipping): tmp/RiskInsights.tsx"
fi
if [ -f "frontend/src/components/prediction/ShapExplanation.tsx" ]; then
    git rm -f "frontend/src/components/prediction/ShapExplanation.tsx"
    echo "Deleted: frontend/src/components/prediction/ShapExplanation.tsx"
else
    echo "Not found (skipping): frontend/src/components/prediction/ShapExplanation.tsx"
fi
if [ -f "tmp/ShapExplanation.tsx" ]; then
    git rm -f "tmp/ShapExplanation.tsx"
    echo "Deleted: tmp/ShapExplanation.tsx"
else
    echo "Not found (skipping): tmp/ShapExplanation.tsx"
fi
if [ -f "tmp/SHAPInsight.tsx" ]; then
    git rm -f "tmp/SHAPInsight.tsx"
    echo "Deleted: tmp/SHAPInsight.tsx"
else
    echo "Not found (skipping): tmp/SHAPInsight.tsx"
fi
if [ -f "tmp/TimeSeriesInsights.tsx" ]; then
    git rm -f "tmp/TimeSeriesInsights.tsx"
    echo "Deleted: tmp/TimeSeriesInsights.tsx"
else
    echo "Not found (skipping): tmp/TimeSeriesInsights.tsx"
fi
if [ -f "tmp/UltraMLInsights.tsx" ]; then
    git rm -f "tmp/UltraMLInsights.tsx"
    echo "Deleted: tmp/UltraMLInsights.tsx"
else
    echo "Not found (skipping): tmp/UltraMLInsights.tsx"
fi
if [ -f "frontend/src/components/analytics/UserStats.tsx" ]; then
    git rm -f "frontend/src/components/analytics/UserStats.tsx"
    echo "Deleted: frontend/src/components/analytics/UserStats.tsx"
else
    echo "Not found (skipping): frontend/src/components/analytics/UserStats.tsx"
fi
if [ -f "tmp/UserStats.tsx" ]; then
    git rm -f "tmp/UserStats.tsx"
    echo "Deleted: tmp/UserStats.tsx"
else
    echo "Not found (skipping): tmp/UserStats.tsx"
fi
if [ -f "tmp/UserStatsSafe.tsx" ]; then
    git rm -f "tmp/UserStatsSafe.tsx"
    echo "Deleted: tmp/UserStatsSafe.tsx"
else
    echo "Not found (skipping): tmp/UserStatsSafe.tsx"
fi
if [ -f "frontend/src/components/prediction/ShapExplanation.test.tsx" ]; then
    git rm -f "frontend/src/components/prediction/ShapExplanation.test.tsx"
    echo "Deleted: frontend/src/components/prediction/ShapExplanation.test.tsx"
else
    echo "Not found (skipping): frontend/src/components/prediction/ShapExplanation.test.tsx"
fi
if [ -f "tmp/RealTimeAPIIntegrationDashboard.tsx" ]; then
    git rm -f "tmp/RealTimeAPIIntegrationDashboard.tsx"
    echo "Deleted: tmp/RealTimeAPIIntegrationDashboard.tsx"
else
    echo "Not found (skipping): tmp/RealTimeAPIIntegrationDashboard.tsx"
fi
if [ -f "frontend/src/pages/AuthPage.tsx" ]; then
    git rm -f "frontend/src/pages/AuthPage.tsx"
    echo "Deleted: frontend/src/pages/AuthPage.tsx"
else
    echo "Not found (skipping): frontend/src/pages/AuthPage.tsx"
fi
if [ -f "AuthPage.tsx" ]; then
    git rm -f "AuthPage.tsx"
    echo "Deleted: AuthPage.tsx"
else
    echo "Not found (skipping): AuthPage.tsx"
fi
if [ -f "PasswordChangeForm.tsx" ]; then
    git rm -f "PasswordChangeForm.tsx"
    echo "Deleted: PasswordChangeForm.tsx"
else
    echo "Not found (skipping): PasswordChangeForm.tsx"
fi
if [ -f "frontend/src/components/shared/layout/ProtectedRoute.tsx" ]; then
    git rm -f "frontend/src/components/shared/layout/ProtectedRoute.tsx"
    echo "Deleted: frontend/src/components/shared/layout/ProtectedRoute.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/layout/ProtectedRoute.tsx"
fi
if [ -f "tmp/ProtectedRoute.tsx" ]; then
    git rm -f "tmp/ProtectedRoute.tsx"
    echo "Deleted: tmp/ProtectedRoute.tsx"
else
    echo "Not found (skipping): tmp/ProtectedRoute.tsx"
fi
if [ -f "tmp/UnifiedAuth.tsx" ]; then
    git rm -f "tmp/UnifiedAuth.tsx"
    echo "Deleted: tmp/UnifiedAuth.tsx"
else
    echo "Not found (skipping): tmp/UnifiedAuth.tsx"
fi
if [ -f "components/Alert.tsx" ]; then
    git rm -f "components/Alert.tsx"
    echo "Deleted: components/Alert.tsx"
else
    echo "Not found (skipping): components/Alert.tsx"
fi
if [ -f "components/Alert.tsx" ]; then
    git rm -f "components/Alert.tsx"
    echo "Deleted: components/Alert.tsx"
else
    echo "Not found (skipping): components/Alert.tsx"
fi
if [ -f "components/Badge.tsx" ]; then
    git rm -f "components/Badge.tsx"
    echo "Deleted: components/Badge.tsx"
else
    echo "Not found (skipping): components/Badge.tsx"
fi
if [ -f "components/Badge.tsx" ]; then
    git rm -f "components/Badge.tsx"
    echo "Deleted: components/Badge.tsx"
else
    echo "Not found (skipping): components/Badge.tsx"
fi
if [ -f "frontend/src/components/prediction/BetRecommendationCard.test.tsx" ]; then
    git rm -f "frontend/src/components/prediction/BetRecommendationCard.test.tsx"
    echo "Deleted: frontend/src/components/prediction/BetRecommendationCard.test.tsx"
else
    echo "Not found (skipping): frontend/src/components/prediction/BetRecommendationCard.test.tsx"
fi
if [ -f "components/Button.tsx" ]; then
    git rm -f "components/Button.tsx"
    echo "Deleted: components/Button.tsx"
else
    echo "Not found (skipping): components/Button.tsx"
fi
if [ -f "components/Button.tsx" ]; then
    git rm -f "components/Button.tsx"
    echo "Deleted: components/Button.tsx"
else
    echo "Not found (skipping): components/Button.tsx"
fi
if [ -f "components/Card.tsx" ]; then
    git rm -f "components/Card.tsx"
    echo "Deleted: components/Card.tsx"
else
    echo "Not found (skipping): components/Card.tsx"
fi
if [ -f "components/Card.tsx" ]; then
    git rm -f "components/Card.tsx"
    echo "Deleted: components/Card.tsx"
else
    echo "Not found (skipping): components/Card.tsx"
fi
if [ -f "frontend/src/components/shared/EnhancedPropCard.test.tsx" ]; then
    git rm -f "frontend/src/components/shared/EnhancedPropCard.test.tsx"
    echo "Deleted: frontend/src/components/shared/EnhancedPropCard.test.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/EnhancedPropCard.test.tsx"
fi
if [ -f "components/Input.tsx" ]; then
    git rm -f "components/Input.tsx"
    echo "Deleted: components/Input.tsx"
else
    echo "Not found (skipping): components/Input.tsx"
fi
if [ -f "components/Input.tsx" ]; then
    git rm -f "components/Input.tsx"
    echo "Deleted: components/Input.tsx"
else
    echo "Not found (skipping): components/Input.tsx"
fi
if [ -f "tmp/Label.tsx" ]; then
    git rm -f "tmp/Label.tsx"
    echo "Deleted: tmp/Label.tsx"
else
    echo "Not found (skipping): tmp/Label.tsx"
fi
if [ -f "frontend/src/components/core/Layout.tsx" ]; then
    git rm -f "frontend/src/components/core/Layout.tsx"
    echo "Deleted: frontend/src/components/core/Layout.tsx"
else
    echo "Not found (skipping): frontend/src/components/core/Layout.tsx"
fi
if [ -f "frontend/src/components/core/Layout/Layout.tsx" ]; then
    git rm -f "frontend/src/components/core/Layout/Layout.tsx"
    echo "Deleted: frontend/src/components/core/Layout/Layout.tsx"
else
    echo "Not found (skipping): frontend/src/components/core/Layout/Layout.tsx"
fi
if [ -f "frontend/src/components/layout/Layout.tsx" ]; then
    git rm -f "frontend/src/components/layout/Layout.tsx"
    echo "Deleted: frontend/src/components/layout/Layout.tsx"
else
    echo "Not found (skipping): frontend/src/components/layout/Layout.tsx"
fi
if [ -f "frontend/src/components/shared/common/layout/Layout.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/layout/Layout.tsx"
    echo "Deleted: frontend/src/components/shared/common/layout/Layout.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/layout/Layout.tsx"
fi
if [ -f "frontend/src/components/optimized/OptimizedPropList.fixed.tsx" ]; then
    git rm -f "frontend/src/components/optimized/OptimizedPropList.fixed.tsx"
    echo "Deleted: frontend/src/components/optimized/OptimizedPropList.fixed.tsx"
else
    echo "Not found (skipping): frontend/src/components/optimized/OptimizedPropList.fixed.tsx"
fi
if [ -f "components/Progress.tsx" ]; then
    git rm -f "components/Progress.tsx"
    echo "Deleted: components/Progress.tsx"
else
    echo "Not found (skipping): components/Progress.tsx"
fi
if [ -f "components/Select.tsx" ]; then
    git rm -f "components/Select.tsx"
    echo "Deleted: components/Select.tsx"
else
    echo "Not found (skipping): components/Select.tsx"
fi
if [ -f "components/Skeleton.tsx" ]; then
    git rm -f "components/Skeleton.tsx"
    echo "Deleted: components/Skeleton.tsx"
else
    echo "Not found (skipping): components/Skeleton.tsx"
fi
if [ -f "tmp/SkeletonLoader.tsx" ]; then
    git rm -f "tmp/SkeletonLoader.tsx"
    echo "Deleted: tmp/SkeletonLoader.tsx"
else
    echo "Not found (skipping): tmp/SkeletonLoader.tsx"
fi
if [ -f "components/Switch.tsx" ]; then
    git rm -f "components/Switch.tsx"
    echo "Deleted: components/Switch.tsx"
else
    echo "Not found (skipping): components/Switch.tsx"
fi
if [ -f "components/Tabs.tsx" ]; then
    git rm -f "components/Tabs.tsx"
    echo "Deleted: components/Tabs.tsx"
else
    echo "Not found (skipping): components/Tabs.tsx"
fi
if [ -f "components/Toast.tsx" ]; then
    git rm -f "components/Toast.tsx"
    echo "Deleted: components/Toast.tsx"
else
    echo "Not found (skipping): components/Toast.tsx"
fi
if [ -f "Toast.tsx" ]; then
    git rm -f "Toast.tsx"
    echo "Deleted: Toast.tsx"
else
    echo "Not found (skipping): Toast.tsx"
fi
if [ -f "tmp/Toaster.tsx" ]; then
    git rm -f "tmp/Toaster.tsx"
    echo "Deleted: tmp/Toaster.tsx"
else
    echo "Not found (skipping): tmp/Toaster.tsx"
fi
if [ -f "components/Toaster.tsx" ]; then
    git rm -f "components/Toaster.tsx"
    echo "Deleted: components/Toaster.tsx"
else
    echo "Not found (skipping): components/Toaster.tsx"
fi
if [ -f "Toaster.tsx" ]; then
    git rm -f "Toaster.tsx"
    echo "Deleted: Toaster.tsx"
else
    echo "Not found (skipping): Toaster.tsx"
fi
if [ -f "components/Tooltip.tsx" ]; then
    git rm -f "components/Tooltip.tsx"
    echo "Deleted: components/Tooltip.tsx"
else
    echo "Not found (skipping): components/Tooltip.tsx"
fi
if [ -f "tmp/BestBetSelector.tsx" ]; then
    git rm -f "tmp/BestBetSelector.tsx"
    echo "Deleted: tmp/BestBetSelector.tsx"
else
    echo "Not found (skipping): tmp/BestBetSelector.tsx"
fi
if [ -f "tmp/BetForm.tsx" ]; then
    git rm -f "tmp/BetForm.tsx"
    echo "Deleted: tmp/BetForm.tsx"
else
    echo "Not found (skipping): tmp/BetForm.tsx"
fi
if [ -f "tmp/BetHistory.tsx" ]; then
    git rm -f "tmp/BetHistory.tsx"
    echo "Deleted: tmp/BetHistory.tsx"
else
    echo "Not found (skipping): tmp/BetHistory.tsx"
fi
if [ -f "tmp/BettingAnalytics.tsx" ]; then
    git rm -f "tmp/BettingAnalytics.tsx"
    echo "Deleted: tmp/BettingAnalytics.tsx"
else
    echo "Not found (skipping): tmp/BettingAnalytics.tsx"
fi
if [ -f "tmp/BettingDataSource.tsx" ]; then
    git rm -f "tmp/BettingDataSource.tsx"
    echo "Deleted: tmp/BettingDataSource.tsx"
else
    echo "Not found (skipping): tmp/BettingDataSource.tsx"
fi
if [ -f "tmp/BettingInterface.tsx" ]; then
    git rm -f "tmp/BettingInterface.tsx"
    echo "Deleted: tmp/BettingInterface.tsx"
else
    echo "Not found (skipping): tmp/BettingInterface.tsx"
fi
if [ -f "tmp/BettingModal.tsx" ]; then
    git rm -f "tmp/BettingModal.tsx"
    echo "Deleted: tmp/BettingModal.tsx"
else
    echo "Not found (skipping): tmp/BettingModal.tsx"
fi
if [ -f "tmp/BettingSettingsContainer.tsx" ]; then
    git rm -f "tmp/BettingSettingsContainer.tsx"
    echo "Deleted: tmp/BettingSettingsContainer.tsx"
else
    echo "Not found (skipping): tmp/BettingSettingsContainer.tsx"
fi
if [ -f "tmp/BettingSettingsPanel.tsx" ]; then
    git rm -f "tmp/BettingSettingsPanel.tsx"
    echo "Deleted: tmp/BettingSettingsPanel.tsx"
else
    echo "Not found (skipping): tmp/BettingSettingsPanel.tsx"
fi
if [ -f "tmp/BettingSettingsSummary.tsx" ]; then
    git rm -f "tmp/BettingSettingsSummary.tsx"
    echo "Deleted: tmp/BettingSettingsSummary.tsx"
else
    echo "Not found (skipping): tmp/BettingSettingsSummary.tsx"
fi
if [ -f "tmp/EventList.tsx" ]; then
    git rm -f "tmp/EventList.tsx"
    echo "Deleted: tmp/EventList.tsx"
else
    echo "Not found (skipping): tmp/EventList.tsx"
fi
if [ -f "frontend/src/components/betting/KellyCalculator.tsx" ]; then
    git rm -f "frontend/src/components/betting/KellyCalculator.tsx"
    echo "Deleted: frontend/src/components/betting/KellyCalculator.tsx"
else
    echo "Not found (skipping): frontend/src/components/betting/KellyCalculator.tsx"
fi
if [ -f "tmp/KellyCalculator.tsx" ]; then
    git rm -f "tmp/KellyCalculator.tsx"
    echo "Deleted: tmp/KellyCalculator.tsx"
else
    echo "Not found (skipping): tmp/KellyCalculator.tsx"
fi
if [ -f "tmp/ModelSelector.tsx" ]; then
    git rm -f "tmp/ModelSelector.tsx"
    echo "Deleted: tmp/ModelSelector.tsx"
else
    echo "Not found (skipping): tmp/ModelSelector.tsx"
fi
if [ -f "tmp/OddsDisplay.tsx" ]; then
    git rm -f "tmp/OddsDisplay.tsx"
    echo "Deleted: tmp/OddsDisplay.tsx"
else
    echo "Not found (skipping): tmp/OddsDisplay.tsx"
fi
if [ -f "tmp/PrizePicksEdgeDisplay.tsx" ]; then
    git rm -f "tmp/PrizePicksEdgeDisplay.tsx"
    echo "Deleted: tmp/PrizePicksEdgeDisplay.tsx"
else
    echo "Not found (skipping): tmp/PrizePicksEdgeDisplay.tsx"
fi
if [ -f "tmp/PrizePicksInterface.tsx" ]; then
    git rm -f "tmp/PrizePicksInterface.tsx"
    echo "Deleted: tmp/PrizePicksInterface.tsx"
else
    echo "Not found (skipping): tmp/PrizePicksInterface.tsx"
fi
if [ -f "frontend/src/components/shared/SHAPVisualization.tsx" ]; then
    git rm -f "frontend/src/components/shared/SHAPVisualization.tsx"
    echo "Deleted: frontend/src/components/shared/SHAPVisualization.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/SHAPVisualization.tsx"
fi
if [ -f "tmp/SHAPVisualization.tsx" ]; then
    git rm -f "tmp/SHAPVisualization.tsx"
    echo "Deleted: tmp/SHAPVisualization.tsx"
else
    echo "Not found (skipping): tmp/SHAPVisualization.tsx"
fi
if [ -f "frontend/src/components/shared/common/SportSelector.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/SportSelector.tsx"
    echo "Deleted: frontend/src/components/shared/common/SportSelector.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/SportSelector.tsx"
fi
if [ -f "tmp/SportSelector.tsx" ]; then
    git rm -f "tmp/SportSelector.tsx"
    echo "Deleted: tmp/SportSelector.tsx"
else
    echo "Not found (skipping): tmp/SportSelector.tsx"
fi
if [ -f "tmp/StakeSizingControl.tsx" ]; then
    git rm -f "tmp/StakeSizingControl.tsx"
    echo "Deleted: tmp/StakeSizingControl.tsx"
else
    echo "Not found (skipping): tmp/StakeSizingControl.tsx"
fi
if [ -f "tmp/UnifiedBettingHistory.tsx" ]; then
    git rm -f "tmp/UnifiedBettingHistory.tsx"
    echo "Deleted: tmp/UnifiedBettingHistory.tsx"
else
    echo "Not found (skipping): tmp/UnifiedBettingHistory.tsx"
fi
if [ -f "frontend/src/components/shared/betting/BettingOpportunityCard.tsx" ]; then
    git rm -f "frontend/src/components/shared/betting/BettingOpportunityCard.tsx"
    echo "Deleted: frontend/src/components/shared/betting/BettingOpportunityCard.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/betting/BettingOpportunityCard.tsx"
fi
if [ -f "tmp/BettingCard.tsx" ]; then
    git rm -f "tmp/BettingCard.tsx"
    echo "Deleted: tmp/BettingCard.tsx"
else
    echo "Not found (skipping): tmp/BettingCard.tsx"
fi
if [ -f "tmp/BuilderIntegrationTest.tsx" ]; then
    git rm -f "tmp/BuilderIntegrationTest.tsx"
    echo "Deleted: tmp/BuilderIntegrationTest.tsx"
else
    echo "Not found (skipping): tmp/BuilderIntegrationTest.tsx"
fi
if [ -f "tmp/BuilderPage.tsx" ]; then
    git rm -f "tmp/BuilderPage.tsx"
    echo "Deleted: tmp/BuilderPage.tsx"
else
    echo "Not found (skipping): tmp/BuilderPage.tsx"
fi
if [ -f "frontend/src/components/charts/PerformanceChart.tsx" ]; then
    git rm -f "frontend/src/components/charts/PerformanceChart.tsx"
    echo "Deleted: frontend/src/components/charts/PerformanceChart.tsx"
else
    echo "Not found (skipping): frontend/src/components/charts/PerformanceChart.tsx"
fi
if [ -f "frontend/src/components/monitoring/PerformanceChart.tsx" ]; then
    git rm -f "frontend/src/components/monitoring/PerformanceChart.tsx"
    echo "Deleted: frontend/src/components/monitoring/PerformanceChart.tsx"
else
    echo "Not found (skipping): frontend/src/components/monitoring/PerformanceChart.tsx"
fi
if [ -f "tmp/PerformanceChart.tsx" ]; then
    git rm -f "tmp/PerformanceChart.tsx"
    echo "Deleted: tmp/PerformanceChart.tsx"
else
    echo "Not found (skipping): tmp/PerformanceChart.tsx"
fi
if [ -f "tmp/SmartControlsBar.test.tsx" ]; then
    git rm -f "tmp/SmartControlsBar.test.tsx"
    echo "Deleted: tmp/SmartControlsBar.test.tsx"
else
    echo "Not found (skipping): tmp/SmartControlsBar.test.tsx"
fi
if [ -f "frontend/src/components/core/AppShell.tsx" ]; then
    git rm -f "frontend/src/components/core/AppShell.tsx"
    echo "Deleted: frontend/src/components/core/AppShell.tsx"
else
    echo "Not found (skipping): frontend/src/components/core/AppShell.tsx"
fi
if [ -f "frontend/src/components/layout/AppShell.tsx" ]; then
    git rm -f "frontend/src/components/layout/AppShell.tsx"
    echo "Deleted: frontend/src/components/layout/AppShell.tsx"
else
    echo "Not found (skipping): frontend/src/components/layout/AppShell.tsx"
fi
if [ -f "tmp/AppShell.tsx" ]; then
    git rm -f "tmp/AppShell.tsx"
    echo "Deleted: tmp/AppShell.tsx"
else
    echo "Not found (skipping): tmp/AppShell.tsx"
fi
if [ -f "frontend/src/components/shared/ErrorBoundary.tsx" ]; then
    git rm -f "frontend/src/components/shared/ErrorBoundary.tsx"
    echo "Deleted: frontend/src/components/shared/ErrorBoundary.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/ErrorBoundary.tsx"
fi
if [ -f "frontend/src/components/shared/common/ErrorBoundary.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/ErrorBoundary.tsx"
    echo "Deleted: frontend/src/components/shared/common/ErrorBoundary.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/ErrorBoundary.tsx"
fi
if [ -f "tmp/ErrorState.tsx" ]; then
    git rm -f "tmp/ErrorState.tsx"
    echo "Deleted: tmp/ErrorState.tsx"
else
    echo "Not found (skipping): tmp/ErrorState.tsx"
fi
if [ -f "tmp/LoadingState.tsx" ]; then
    git rm -f "tmp/LoadingState.tsx"
    echo "Deleted: tmp/LoadingState.tsx"
else
    echo "Not found (skipping): tmp/LoadingState.tsx"
fi
if [ -f "frontend/src/components/core/Navbar/Navbar.tsx" ]; then
    git rm -f "frontend/src/components/core/Navbar/Navbar.tsx"
    echo "Deleted: frontend/src/components/core/Navbar/Navbar.tsx"
else
    echo "Not found (skipping): frontend/src/components/core/Navbar/Navbar.tsx"
fi
if [ -f "frontend/src/components/Navbar/Navbar.tsx" ]; then
    git rm -f "frontend/src/components/Navbar/Navbar.tsx"
    echo "Deleted: frontend/src/components/Navbar/Navbar.tsx"
else
    echo "Not found (skipping): frontend/src/components/Navbar/Navbar.tsx"
fi
if [ -f "frontend/src/components/navigation/Navbar.tsx" ]; then
    git rm -f "frontend/src/components/navigation/Navbar.tsx"
    echo "Deleted: frontend/src/components/navigation/Navbar.tsx"
else
    echo "Not found (skipping): frontend/src/components/navigation/Navbar.tsx"
fi
if [ -f "frontend/src/components/shared/common/layout/Navbar.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/layout/Navbar.tsx"
    echo "Deleted: frontend/src/components/shared/common/layout/Navbar.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/layout/Navbar.tsx"
fi
if [ -f "tmp/Navbar.tsx" ]; then
    git rm -f "tmp/Navbar.tsx"
    echo "Deleted: tmp/Navbar.tsx"
else
    echo "Not found (skipping): tmp/Navbar.tsx"
fi
if [ -f "frontend/src/components/layout/Navigation.tsx" ]; then
    git rm -f "frontend/src/components/layout/Navigation.tsx"
    echo "Deleted: frontend/src/components/layout/Navigation.tsx"
else
    echo "Not found (skipping): frontend/src/components/layout/Navigation.tsx"
fi
if [ -f "frontend/src/components/shared/layout/Navigation.tsx" ]; then
    git rm -f "frontend/src/components/shared/layout/Navigation.tsx"
    echo "Deleted: frontend/src/components/shared/layout/Navigation.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/layout/Navigation.tsx"
fi
if [ -f "tmp/Navigation.tsx" ]; then
    git rm -f "tmp/Navigation.tsx"
    echo "Deleted: tmp/Navigation.tsx"
else
    echo "Not found (skipping): tmp/Navigation.tsx"
fi
if [ -f "frontend/src/components/core/Sidebar.tsx" ]; then
    git rm -f "frontend/src/components/core/Sidebar.tsx"
    echo "Deleted: frontend/src/components/core/Sidebar.tsx"
else
    echo "Not found (skipping): frontend/src/components/core/Sidebar.tsx"
fi
if [ -f "frontend/src/components/navigation/Sidebar.tsx" ]; then
    git rm -f "frontend/src/components/navigation/Sidebar.tsx"
    echo "Deleted: frontend/src/components/navigation/Sidebar.tsx"
else
    echo "Not found (skipping): frontend/src/components/navigation/Sidebar.tsx"
fi
if [ -f "frontend/src/components/shared/common/layout/Sidebar.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/layout/Sidebar.tsx"
    echo "Deleted: frontend/src/components/shared/common/layout/Sidebar.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/layout/Sidebar.tsx"
fi
if [ -f "frontend/src/components/Sidebar/Sidebar.tsx" ]; then
    git rm -f "frontend/src/components/Sidebar/Sidebar.tsx"
    echo "Deleted: frontend/src/components/Sidebar/Sidebar.tsx"
else
    echo "Not found (skipping): frontend/src/components/Sidebar/Sidebar.tsx"
fi
if [ -f "tmp/Sidebar.tsx" ]; then
    git rm -f "tmp/Sidebar.tsx"
    echo "Deleted: tmp/Sidebar.tsx"
else
    echo "Not found (skipping): tmp/Sidebar.tsx"
fi
if [ -f "tmp/CyberAnalyticsHub.tsx" ]; then
    git rm -f "tmp/CyberAnalyticsHub.tsx"
    echo "Deleted: tmp/CyberAnalyticsHub.tsx"
else
    echo "Not found (skipping): tmp/CyberAnalyticsHub.tsx"
fi
if [ -f "tmp/CyberMLDashboard.tsx" ]; then
    git rm -f "tmp/CyberMLDashboard.tsx"
    echo "Deleted: tmp/CyberMLDashboard.tsx"
else
    echo "Not found (skipping): tmp/CyberMLDashboard.tsx"
fi
if [ -f "tmp/AIEdgeML.tsx" ]; then
    git rm -f "tmp/AIEdgeML.tsx"
    echo "Deleted: tmp/AIEdgeML.tsx"
else
    echo "Not found (skipping): tmp/AIEdgeML.tsx"
fi
if [ -f "tmp/BusinessAnalysis.tsx" ]; then
    git rm -f "tmp/BusinessAnalysis.tsx"
    echo "Deleted: tmp/BusinessAnalysis.tsx"
else
    echo "Not found (skipping): tmp/BusinessAnalysis.tsx"
fi
if [ -f "tmp/EnhancedAPITestDashboard.tsx" ]; then
    git rm -f "tmp/EnhancedAPITestDashboard.tsx"
    echo "Deleted: tmp/EnhancedAPITestDashboard.tsx"
else
    echo "Not found (skipping): tmp/EnhancedAPITestDashboard.tsx"
fi
if [ -f "tmp/EnhancedPrizePicks.tsx" ]; then
    git rm -f "tmp/EnhancedPrizePicks.tsx"
    echo "Deleted: tmp/EnhancedPrizePicks.tsx"
else
    echo "Not found (skipping): tmp/EnhancedPrizePicks.tsx"
fi
if [ -f "tmp/UnifiedEventDetails.tsx" ]; then
    git rm -f "tmp/UnifiedEventDetails.tsx"
    echo "Deleted: tmp/UnifiedEventDetails.tsx"
else
    echo "Not found (skipping): tmp/UnifiedEventDetails.tsx"
fi
if [ -f "tmp/Arbitrage.tsx" ]; then
    git rm -f "tmp/Arbitrage.tsx"
    echo "Deleted: tmp/Arbitrage.tsx"
else
    echo "Not found (skipping): tmp/Arbitrage.tsx"
fi
if [ -f "tmp/ArbitrageDetector.tsx" ]; then
    git rm -f "tmp/ArbitrageDetector.tsx"
    echo "Deleted: tmp/ArbitrageDetector.tsx"
else
    echo "Not found (skipping): tmp/ArbitrageDetector.tsx"
fi
if [ -f "tmp/BetBuilder.test.tsx" ]; then
    git rm -f "tmp/BetBuilder.test.tsx"
    echo "Deleted: tmp/BetBuilder.test.tsx"
else
    echo "Not found (skipping): tmp/BetBuilder.test.tsx"
fi
if [ -f "tmp/BetBuilder.tsx" ]; then
    git rm -f "tmp/BetBuilder.tsx"
    echo "Deleted: tmp/BetBuilder.tsx"
else
    echo "Not found (skipping): tmp/BetBuilder.tsx"
fi
if [ -f "tmp/BetSlipSidebar.tsx" ]; then
    git rm -f "tmp/BetSlipSidebar.tsx"
    echo "Deleted: tmp/BetSlipSidebar.tsx"
else
    echo "Not found (skipping): tmp/BetSlipSidebar.tsx"
fi
if [ -f "tmp/BettingOpportunity.tsx" ]; then
    git rm -f "tmp/BettingOpportunity.tsx"
    echo "Deleted: tmp/BettingOpportunity.tsx"
else
    echo "Not found (skipping): tmp/BettingOpportunity.tsx"
fi
if [ -f "tmp/BettingRecommendations.tsx" ]; then
    git rm -f "tmp/BettingRecommendations.tsx"
    echo "Deleted: tmp/BettingRecommendations.tsx"
else
    echo "Not found (skipping): tmp/BettingRecommendations.tsx"
fi
if [ -f "frontend/src/components/features/tracking/EntryTracking.tsx" ]; then
    git rm -f "frontend/src/components/features/tracking/EntryTracking.tsx"
    echo "Deleted: frontend/src/components/features/tracking/EntryTracking.tsx"
else
    echo "Not found (skipping): frontend/src/components/features/tracking/EntryTracking.tsx"
fi
if [ -f "tmp/EntryTracking.tsx" ]; then
    git rm -f "tmp/EntryTracking.tsx"
    echo "Deleted: tmp/EntryTracking.tsx"
else
    echo "Not found (skipping): tmp/EntryTracking.tsx"
fi
if [ -f "frontend/src/components/shared/common/modals/Modals.tsx" ]; then
    git rm -f "frontend/src/components/shared/common/modals/Modals.tsx"
    echo "Deleted: frontend/src/components/shared/common/modals/Modals.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/common/modals/Modals.tsx"
fi
if [ -f "tmp/Modals.tsx" ]; then
    git rm -f "tmp/Modals.tsx"
    echo "Deleted: tmp/Modals.tsx"
else
    echo "Not found (skipping): tmp/Modals.tsx"
fi
if [ -f "tmp/BankrollMetrics.tsx" ]; then
    git rm -f "tmp/BankrollMetrics.tsx"
    echo "Deleted: tmp/BankrollMetrics.tsx"
else
    echo "Not found (skipping): tmp/BankrollMetrics.tsx"
fi
if [ -f "tmp/BankrollStats.tsx" ]; then
    git rm -f "tmp/BankrollStats.tsx"
    echo "Deleted: tmp/BankrollStats.tsx"
else
    echo "Not found (skipping): tmp/BankrollStats.tsx"
fi
if [ -f "frontend/src/components/shared/feedback/FeedbackWidget.tsx" ]; then
    git rm -f "frontend/src/components/shared/feedback/FeedbackWidget.tsx"
    echo "Deleted: frontend/src/components/shared/feedback/FeedbackWidget.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/feedback/FeedbackWidget.tsx"
fi
if [ -f "tmp/FeedbackWidget.tsx" ]; then
    git rm -f "tmp/FeedbackWidget.tsx"
    echo "Deleted: tmp/FeedbackWidget.tsx"
else
    echo "Not found (skipping): tmp/FeedbackWidget.tsx"
fi
if [ -f "frontend/src/components/shared/betting/BettingFilters.tsx" ]; then
    git rm -f "frontend/src/components/shared/betting/BettingFilters.tsx"
    echo "Deleted: frontend/src/components/shared/betting/BettingFilters.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/betting/BettingFilters.tsx"
fi
if [ -f "tmp/CompactFilterBar.tsx" ]; then
    git rm -f "tmp/CompactFilterBar.tsx"
    echo "Deleted: tmp/CompactFilterBar.tsx"
else
    echo "Not found (skipping): tmp/CompactFilterBar.tsx"
fi
if [ -f "tmp/FluentLiveFilters.tsx" ]; then
    git rm -f "tmp/FluentLiveFilters.tsx"
    echo "Deleted: tmp/FluentLiveFilters.tsx"
else
    echo "Not found (skipping): tmp/FluentLiveFilters.tsx"
fi
if [ -f "tmp/InGameTimeFilter.tsx" ]; then
    git rm -f "tmp/InGameTimeFilter.tsx"
    echo "Deleted: tmp/InGameTimeFilter.tsx"
else
    echo "Not found (skipping): tmp/InGameTimeFilter.tsx"
fi
if [ -f "tmp/QuantumFilters.tsx" ]; then
    git rm -f "tmp/QuantumFilters.tsx"
    echo "Deleted: tmp/QuantumFilters.tsx"
else
    echo "Not found (skipping): tmp/QuantumFilters.tsx"
fi
if [ -f "tmp/EnhancedIntelligenceViews.tsx" ]; then
    git rm -f "tmp/EnhancedIntelligenceViews.tsx"
    echo "Deleted: tmp/EnhancedIntelligenceViews.tsx"
else
    echo "Not found (skipping): tmp/EnhancedIntelligenceViews.tsx"
fi
if [ -f "tmp/EnhancedModuleManagement.tsx" ]; then
    git rm -f "tmp/EnhancedModuleManagement.tsx"
    echo "Deleted: tmp/EnhancedModuleManagement.tsx"
else
    echo "Not found (skipping): tmp/EnhancedModuleManagement.tsx"
fi
if [ -f "tmp/EnhancedModuleSection.tsx" ]; then
    git rm -f "tmp/EnhancedModuleSection.tsx"
    echo "Deleted: tmp/EnhancedModuleSection.tsx"
else
    echo "Not found (skipping): tmp/EnhancedModuleSection.tsx"
fi
if [ -f "tmp/ModuleEnhancement.tsx" ]; then
    git rm -f "tmp/ModuleEnhancement.tsx"
    echo "Deleted: tmp/ModuleEnhancement.tsx"
else
    echo "Not found (skipping): tmp/ModuleEnhancement.tsx"
fi
if [ -f "tmp/ModuleEnhancements.tsx" ]; then
    git rm -f "tmp/ModuleEnhancements.tsx"
    echo "Deleted: tmp/ModuleEnhancements.tsx"
else
    echo "Not found (skipping): tmp/ModuleEnhancements.tsx"
fi
if [ -f "tmp/AdvancedSidebar.tsx" ]; then
    git rm -f "tmp/AdvancedSidebar.tsx"
    echo "Deleted: tmp/AdvancedSidebar.tsx"
else
    echo "Not found (skipping): tmp/AdvancedSidebar.tsx"
fi
if [ -f "tmp/CyberHeader.tsx" ]; then
    git rm -f "tmp/CyberHeader.tsx"
    echo "Deleted: tmp/CyberHeader.tsx"
else
    echo "Not found (skipping): tmp/CyberHeader.tsx"
fi
if [ -f "tmp/CyberLayout.tsx" ]; then
    git rm -f "tmp/CyberLayout.tsx"
    echo "Deleted: tmp/CyberLayout.tsx"
else
    echo "Not found (skipping): tmp/CyberLayout.tsx"
fi
if [ -f "tmp/CyberSidebar.tsx" ]; then
    git rm -f "tmp/CyberSidebar.tsx"
    echo "Deleted: tmp/CyberSidebar.tsx"
else
    echo "Not found (skipping): tmp/CyberSidebar.tsx"
fi
if [ -f "tmp/EliteSportsHeader.tsx" ]; then
    git rm -f "tmp/EliteSportsHeader.tsx"
    echo "Deleted: tmp/EliteSportsHeader.tsx"
else
    echo "Not found (skipping): tmp/EliteSportsHeader.tsx"
fi
if [ -f "tmp/EnhancedModernLayout.tsx" ]; then
    git rm -f "tmp/EnhancedModernLayout.tsx"
    echo "Deleted: tmp/EnhancedModernLayout.tsx"
else
    echo "Not found (skipping): tmp/EnhancedModernLayout.tsx"
fi
if [ -f "tmp/SmartLineupBuilder.tsx" ]; then
    git rm -f "tmp/SmartLineupBuilder.tsx"
    echo "Deleted: tmp/SmartLineupBuilder.tsx"
else
    echo "Not found (skipping): tmp/SmartLineupBuilder.tsx"
fi
if [ -f "tmp/SavedLineups.tsx" ]; then
    git rm -f "tmp/SavedLineups.tsx"
    echo "Deleted: tmp/SavedLineups.tsx"
else
    echo "Not found (skipping): tmp/SavedLineups.tsx"
fi
if [ -f "tmp/MarketIntelligence.tsx" ]; then
    git rm -f "tmp/MarketIntelligence.tsx"
    echo "Deleted: tmp/MarketIntelligence.tsx"
else
    echo "Not found (skipping): tmp/MarketIntelligence.tsx"
fi
if [ -f "tmp/CyberTheme.tsx" ]; then
    git rm -f "tmp/CyberTheme.tsx"
    echo "Deleted: tmp/CyberTheme.tsx"
else
    echo "Not found (skipping): tmp/CyberTheme.tsx"
fi
if [ -f "tmp/MegaAdminPanel.tsx" ]; then
    git rm -f "tmp/MegaAdminPanel.tsx"
    echo "Deleted: tmp/MegaAdminPanel.tsx"
else
    echo "Not found (skipping): tmp/MegaAdminPanel.tsx"
fi
if [ -f "tmp/MegaLayout.tsx" ]; then
    git rm -f "tmp/MegaLayout.tsx"
    echo "Deleted: tmp/MegaLayout.tsx"
else
    echo "Not found (skipping): tmp/MegaLayout.tsx"
fi
if [ -f "tmp/MegaPrizePicks.tsx" ]; then
    git rm -f "tmp/MegaPrizePicks.tsx"
    echo "Deleted: tmp/MegaPrizePicks.tsx"
else
    echo "Not found (skipping): tmp/MegaPrizePicks.tsx"
fi
if [ -f "tmp/MegaUI.tsx" ]; then
    git rm -f "tmp/MegaUI.tsx"
    echo "Deleted: tmp/MegaUI.tsx"
else
    echo "Not found (skipping): tmp/MegaUI.tsx"
fi
if [ -f "tmp/MobileOptimizedInterface.tsx" ]; then
    git rm -f "tmp/MobileOptimizedInterface.tsx"
    echo "Deleted: tmp/MobileOptimizedInterface.tsx"
else
    echo "Not found (skipping): tmp/MobileOptimizedInterface.tsx"
fi
if [ -f "tmp/MonitoringDashboard.tsx" ]; then
    git rm -f "tmp/MonitoringDashboard.tsx"
    echo "Deleted: tmp/MonitoringDashboard.tsx"
else
    echo "Not found (skipping): tmp/MonitoringDashboard.tsx"
fi
if [ -f "tmp/PerformanceAlert.tsx" ]; then
    git rm -f "tmp/PerformanceAlert.tsx"
    echo "Deleted: tmp/PerformanceAlert.tsx"
else
    echo "Not found (skipping): tmp/PerformanceAlert.tsx"
fi
if [ -f "tmp/PerformanceAlertContainer.tsx" ]; then
    git rm -f "tmp/PerformanceAlertContainer.tsx"
    echo "Deleted: tmp/PerformanceAlertContainer.tsx"
else
    echo "Not found (skipping): tmp/PerformanceAlertContainer.tsx"
fi
if [ -f "tmp/UnifiedNavigation.tsx" ]; then
    git rm -f "tmp/UnifiedNavigation.tsx"
    echo "Deleted: tmp/UnifiedNavigation.tsx"
else
    echo "Not found (skipping): tmp/UnifiedNavigation.tsx"
fi
if [ -f "tmp/UltraAccuracyOverview.tsx" ]; then
    git rm -f "tmp/UltraAccuracyOverview.tsx"
    echo "Deleted: tmp/UltraAccuracyOverview.tsx"
else
    echo "Not found (skipping): tmp/UltraAccuracyOverview.tsx"
fi
if [ -f "frontend/src/onboarding/OnboardingFlow.tsx" ]; then
    git rm -f "frontend/src/onboarding/OnboardingFlow.tsx"
    echo "Deleted: frontend/src/onboarding/OnboardingFlow.tsx"
else
    echo "Not found (skipping): frontend/src/onboarding/OnboardingFlow.tsx"
fi
if [ -f "frontend/src/components/shared/StatusIndicator.tsx" ]; then
    git rm -f "frontend/src/components/shared/StatusIndicator.tsx"
    echo "Deleted: frontend/src/components/shared/StatusIndicator.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/StatusIndicator.tsx"
fi
if [ -f "tmp/AdvancedConfidenceVisualizer.tsx" ]; then
    git rm -f "tmp/AdvancedConfidenceVisualizer.tsx"
    echo "Deleted: tmp/AdvancedConfidenceVisualizer.tsx"
else
    echo "Not found (skipping): tmp/AdvancedConfidenceVisualizer.tsx"
fi
if [ -f "tmp/BetRecommendationCard.tsx" ]; then
    git rm -f "tmp/BetRecommendationCard.tsx"
    echo "Deleted: tmp/BetRecommendationCard.tsx"
else
    echo "Not found (skipping): tmp/BetRecommendationCard.tsx"
fi
if [ -f "tmp/BetRecommendationList.tsx" ]; then
    git rm -f "tmp/BetRecommendationList.tsx"
    echo "Deleted: tmp/BetRecommendationList.tsx"
else
    echo "Not found (skipping): tmp/BetRecommendationList.tsx"
fi
if [ -f "tmp/MoneyMakerResults.tsx" ]; then
    git rm -f "tmp/MoneyMakerResults.tsx"
    echo "Deleted: tmp/MoneyMakerResults.tsx"
else
    echo "Not found (skipping): tmp/MoneyMakerResults.tsx"
fi
if [ -f "tmp/PredictionExplanationModal.tsx" ]; then
    git rm -f "tmp/PredictionExplanationModal.tsx"
    echo "Deleted: tmp/PredictionExplanationModal.tsx"
else
    echo "Not found (skipping): tmp/PredictionExplanationModal.tsx"
fi
if [ -f "tmp/PredictionForm.tsx" ]; then
    git rm -f "tmp/PredictionForm.tsx"
    echo "Deleted: tmp/PredictionForm.tsx"
else
    echo "Not found (skipping): tmp/PredictionForm.tsx"
fi
if [ -f "tmp/QuantumPredictionsInterface.tsx" ]; then
    git rm -f "tmp/QuantumPredictionsInterface.tsx"
    echo "Deleted: tmp/QuantumPredictionsInterface.tsx"
else
    echo "Not found (skipping): tmp/QuantumPredictionsInterface.tsx"
fi
if [ -f "tmp/ShapValueBar.tsx" ]; then
    git rm -f "tmp/ShapValueBar.tsx"
    echo "Deleted: tmp/ShapValueBar.tsx"
else
    echo "Not found (skipping): tmp/ShapValueBar.tsx"
fi
if [ -f "tmp/UltraAccuracyDashboard.tsx" ]; then
    git rm -f "tmp/UltraAccuracyDashboard.tsx"
    echo "Deleted: tmp/UltraAccuracyDashboard.tsx"
else
    echo "Not found (skipping): tmp/UltraAccuracyDashboard.tsx"
fi
if [ -f "tmp/UncertaintyIndicator.tsx" ]; then
    git rm -f "tmp/UncertaintyIndicator.tsx"
    echo "Deleted: tmp/UncertaintyIndicator.tsx"
else
    echo "Not found (skipping): tmp/UncertaintyIndicator.tsx"
fi
if [ -f "tmp/UnifiedPredictionInterface.tsx" ]; then
    git rm -f "tmp/UnifiedPredictionInterface.tsx"
    echo "Deleted: tmp/UnifiedPredictionInterface.tsx"
else
    echo "Not found (skipping): tmp/UnifiedPredictionInterface.tsx"
fi
if [ -f "tmp/BetRecommendationList.test.tsx" ]; then
    git rm -f "tmp/BetRecommendationList.test.tsx"
    echo "Deleted: tmp/BetRecommendationList.test.tsx"
else
    echo "Not found (skipping): tmp/BetRecommendationList.test.tsx"
fi
if [ -f "tmp/DailyFantasyIntegration.tsx" ]; then
    git rm -f "tmp/DailyFantasyIntegration.tsx"
    echo "Deleted: tmp/DailyFantasyIntegration.tsx"
else
    echo "Not found (skipping): tmp/DailyFantasyIntegration.tsx"
fi
if [ -f "tmp/FantasyPredictionEnhancer.tsx" ]; then
    git rm -f "tmp/FantasyPredictionEnhancer.tsx"
    echo "Deleted: tmp/FantasyPredictionEnhancer.tsx"
else
    echo "Not found (skipping): tmp/FantasyPredictionEnhancer.tsx"
fi
if [ -f "tmp/LivePredictions.tsx" ]; then
    git rm -f "tmp/LivePredictions.tsx"
    echo "Deleted: tmp/LivePredictions.tsx"
else
    echo "Not found (skipping): tmp/LivePredictions.tsx"
fi
if [ -f "tmp/PayoutPreviewPanel.tsx" ]; then
    git rm -f "tmp/PayoutPreviewPanel.tsx"
    echo "Deleted: tmp/PayoutPreviewPanel.tsx"
else
    echo "Not found (skipping): tmp/PayoutPreviewPanel.tsx"
fi
if [ -f "tmp/PredictionGenerator.tsx" ]; then
    git rm -f "tmp/PredictionGenerator.tsx"
    echo "Deleted: tmp/PredictionGenerator.tsx"
else
    echo "Not found (skipping): tmp/PredictionGenerator.tsx"
fi
if [ -f "tmp/SHAPChart.tsx" ]; then
    git rm -f "tmp/SHAPChart.tsx"
    echo "Deleted: tmp/SHAPChart.tsx"
else
    echo "Not found (skipping): tmp/SHAPChart.tsx"
fi
if [ -f "tmp/UniversalPredictions.tsx" ]; then
    git rm -f "tmp/UniversalPredictions.tsx"
    echo "Deleted: tmp/UniversalPredictions.tsx"
else
    echo "Not found (skipping): tmp/UniversalPredictions.tsx"
fi
if [ -f "tmp/ProfilePage.tsx" ]; then
    git rm -f "tmp/ProfilePage.tsx"
    echo "Deleted: tmp/ProfilePage.tsx"
else
    echo "Not found (skipping): tmp/ProfilePage.tsx"
fi
if [ -f "tmp/UnifiedProfile.tsx" ]; then
    git rm -f "tmp/UnifiedProfile.tsx"
    echo "Deleted: tmp/UnifiedProfile.tsx"
else
    echo "Not found (skipping): tmp/UnifiedProfile.tsx"
fi
if [ -f "tmp/RealTimeDataStream.tsx" ]; then
    git rm -f "tmp/RealTimeDataStream.tsx"
    echo "Deleted: tmp/RealTimeDataStream.tsx"
else
    echo "Not found (skipping): tmp/RealTimeDataStream.tsx"
fi
if [ -f "tmp/EnhancedRevolutionaryInterface.tsx" ]; then
    git rm -f "tmp/EnhancedRevolutionaryInterface.tsx"
    echo "Deleted: tmp/EnhancedRevolutionaryInterface.tsx"
else
    echo "Not found (skipping): tmp/EnhancedRevolutionaryInterface.tsx"
fi
if [ -f "tmp/RevolutionaryAccuracyInterface.tsx" ]; then
    git rm -f "tmp/RevolutionaryAccuracyInterface.tsx"
    echo "Deleted: tmp/RevolutionaryAccuracyInterface.tsx"
else
    echo "Not found (skipping): tmp/RevolutionaryAccuracyInterface.tsx"
fi
if [ -f "tmp/UltimateSettingsPage.tsx" ]; then
    git rm -f "tmp/UltimateSettingsPage.tsx"
    echo "Deleted: tmp/UltimateSettingsPage.tsx"
else
    echo "Not found (skipping): tmp/UltimateSettingsPage.tsx"
fi
if [ -f "tmp/UnifiedSettingsInterface.tsx" ]; then
    git rm -f "tmp/UnifiedSettingsInterface.tsx"
    echo "Deleted: tmp/UnifiedSettingsInterface.tsx"
else
    echo "Not found (skipping): tmp/UnifiedSettingsInterface.tsx"
fi
if [ -f "frontend/src/components/shared/GlassCard.tsx" ]; then
    git rm -f "frontend/src/components/shared/GlassCard.tsx"
    echo "Deleted: frontend/src/components/shared/GlassCard.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/GlassCard.tsx"
fi
if [ -f "frontend/src/components/shared/GlassCard.tsx" ]; then
    git rm -f "frontend/src/components/shared/GlassCard.tsx"
    echo "Deleted: frontend/src/components/shared/GlassCard.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/GlassCard.tsx"
fi
if [ -f "GlassCard.tsx" ]; then
    git rm -f "GlassCard.tsx"
    echo "Deleted: GlassCard.tsx"
else
    echo "Not found (skipping): GlassCard.tsx"
fi
if [ -f "tmp/RiskReasoningDisplay.tsx" ]; then
    git rm -f "tmp/RiskReasoningDisplay.tsx"
    echo "Deleted: tmp/RiskReasoningDisplay.tsx"
else
    echo "Not found (skipping): tmp/RiskReasoningDisplay.tsx"
fi
if [ -f "tmp/DataUnavailableMessage.tsx" ]; then
    git rm -f "tmp/DataUnavailableMessage.tsx"
    echo "Deleted: tmp/DataUnavailableMessage.tsx"
else
    echo "Not found (skipping): tmp/DataUnavailableMessage.tsx"
fi
if [ -f "tmp/ErrorMessage.tsx" ]; then
    git rm -f "tmp/ErrorMessage.tsx"
    echo "Deleted: tmp/ErrorMessage.tsx"
else
    echo "Not found (skipping): tmp/ErrorMessage.tsx"
fi
if [ -f "tmp/RiskLevelIndicator.tsx" ]; then
    git rm -f "tmp/RiskLevelIndicator.tsx"
    echo "Deleted: tmp/RiskLevelIndicator.tsx"
else
    echo "Not found (skipping): tmp/RiskLevelIndicator.tsx"
fi
if [ -f "tmp/SafeButton.tsx" ]; then
    git rm -f "tmp/SafeButton.tsx"
    echo "Deleted: tmp/SafeButton.tsx"
else
    echo "Not found (skipping): tmp/SafeButton.tsx"
fi
if [ -f "tmp/ToastProvider.tsx" ]; then
    git rm -f "tmp/ToastProvider.tsx"
    echo "Deleted: tmp/ToastProvider.tsx"
else
    echo "Not found (skipping): tmp/ToastProvider.tsx"
fi
if [ -f "tmp/ValidationStatus.tsx" ]; then
    git rm -f "tmp/ValidationStatus.tsx"
    echo "Deleted: tmp/ValidationStatus.tsx"
else
    echo "Not found (skipping): tmp/ValidationStatus.tsx"
fi
if [ -f "tmp/BettingButton.tsx" ]; then
    git rm -f "tmp/BettingButton.tsx"
    echo "Deleted: tmp/BettingButton.tsx"
else
    echo "Not found (skipping): tmp/BettingButton.tsx"
fi
if [ -f "tmp/BettingButtonGroup.tsx" ]; then
    git rm -f "tmp/BettingButtonGroup.tsx"
    echo "Deleted: tmp/BettingButtonGroup.tsx"
else
    echo "Not found (skipping): tmp/BettingButtonGroup.tsx"
fi
if [ -f "tmp/QuickBetButton.tsx" ]; then
    git rm -f "tmp/QuickBetButton.tsx"
    echo "Deleted: tmp/QuickBetButton.tsx"
else
    echo "Not found (skipping): tmp/QuickBetButton.tsx"
fi
if [ -f "frontend/src/layouts/MainLayout.tsx" ]; then
    git rm -f "frontend/src/layouts/MainLayout.tsx"
    echo "Deleted: frontend/src/layouts/MainLayout.tsx"
else
    echo "Not found (skipping): frontend/src/layouts/MainLayout.tsx"
fi
if [ -f "tmp/MainLayout.tsx" ]; then
    git rm -f "tmp/MainLayout.tsx"
    echo "Deleted: tmp/MainLayout.tsx"
else
    echo "Not found (skipping): tmp/MainLayout.tsx"
fi
if [ -f "frontend/src/providers/ThemeProvider.tsx" ]; then
    git rm -f "frontend/src/providers/ThemeProvider.tsx"
    echo "Deleted: frontend/src/providers/ThemeProvider.tsx"
else
    echo "Not found (skipping): frontend/src/providers/ThemeProvider.tsx"
fi
if [ -f "frontend/src/theme/ThemeProvider.tsx" ]; then
    git rm -f "frontend/src/theme/ThemeProvider.tsx"
    echo "Deleted: frontend/src/theme/ThemeProvider.tsx"
else
    echo "Not found (skipping): frontend/src/theme/ThemeProvider.tsx"
fi
if [ -f "tmp/advanced-charts.tsx" ]; then
    git rm -f "tmp/advanced-charts.tsx"
    echo "Deleted: tmp/advanced-charts.tsx"
else
    echo "Not found (skipping): tmp/advanced-charts.tsx"
fi
if [ -f "button.tsx" ]; then
    git rm -f "button.tsx"
    echo "Deleted: button.tsx"
else
    echo "Not found (skipping): button.tsx"
fi
if [ -f "card.tsx" ]; then
    git rm -f "card.tsx"
    echo "Deleted: card.tsx"
else
    echo "Not found (skipping): card.tsx"
fi
if [ -f "frontend/src/components/shared/GlowButton.tsx" ]; then
    git rm -f "frontend/src/components/shared/GlowButton.tsx"
    echo "Deleted: frontend/src/components/shared/GlowButton.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/GlowButton.tsx"
fi
if [ -f "GlowButton.tsx" ]; then
    git rm -f "GlowButton.tsx"
    echo "Deleted: GlowButton.tsx"
else
    echo "Not found (skipping): GlowButton.tsx"
fi
if [ -f "frontend/src/components/shared/NotificationToast.tsx" ]; then
    git rm -f "frontend/src/components/shared/NotificationToast.tsx"
    echo "Deleted: frontend/src/components/shared/NotificationToast.tsx"
else
    echo "Not found (skipping): frontend/src/components/shared/NotificationToast.tsx"
fi
if [ -f "NotificationToast.tsx" ]; then
    git rm -f "NotificationToast.tsx"
    echo "Deleted: NotificationToast.tsx"
else
    echo "Not found (skipping): NotificationToast.tsx"
fi
if [ -f "tmp/PredictionSummaryCard.test.tsx" ]; then
    git rm -f "tmp/PredictionSummaryCard.test.tsx"
    echo "Deleted: tmp/PredictionSummaryCard.test.tsx"
else
    echo "Not found (skipping): tmp/PredictionSummaryCard.test.tsx"
fi
if [ -f "tmp/tabs-simple.tsx" ]; then
    git rm -f "tmp/tabs-simple.tsx"
    echo "Deleted: tmp/tabs-simple.tsx"
else
    echo "Not found (skipping): tmp/tabs-simple.tsx"
fi
if [ -f "tmp/UnifiedMoneyMakerIntegration.tsx" ]; then
    git rm -f "tmp/UnifiedMoneyMakerIntegration.tsx"
    echo "Deleted: tmp/UnifiedMoneyMakerIntegration.tsx"
else
    echo "Not found (skipping): tmp/UnifiedMoneyMakerIntegration.tsx"
fi
if [ -f "tmp/UnifiedStrategyConfig.tsx" ]; then
    git rm -f "tmp/UnifiedStrategyConfig.tsx"
    echo "Deleted: tmp/UnifiedStrategyConfig.tsx"
else
    echo "Not found (skipping): tmp/UnifiedStrategyConfig.tsx"
fi
if [ -f "tmp/UnifiedStrategyEngineDisplay.tsx" ]; then
    git rm -f "tmp/UnifiedStrategyEngineDisplay.tsx"
    echo "Deleted: tmp/UnifiedStrategyEngineDisplay.tsx"
else
    echo "Not found (skipping): tmp/UnifiedStrategyEngineDisplay.tsx"
fi
if [ -f "tmp/IntelligentMergedInterface.tsx" ]; then
    git rm -f "tmp/IntelligentMergedInterface.tsx"
    echo "Deleted: tmp/IntelligentMergedInterface.tsx"
else
    echo "Not found (skipping): tmp/IntelligentMergedInterface.tsx"
fi
if [ -f "tmp/ArbitrageHunter.tsx" ]; then
    git rm -f "tmp/ArbitrageHunter.tsx"
    echo "Deleted: tmp/ArbitrageHunter.tsx"
else
    echo "Not found (skipping): tmp/ArbitrageHunter.tsx"
fi
if [ -f "tmp/ComprehensiveUserProfile.tsx" ]; then
    git rm -f "tmp/ComprehensiveUserProfile.tsx"
    echo "Deleted: tmp/ComprehensiveUserProfile.tsx"
else
    echo "Not found (skipping): tmp/ComprehensiveUserProfile.tsx"
fi
if [ -f "tmp/ConsolidatedUserProfile.tsx" ]; then
    git rm -f "tmp/ConsolidatedUserProfile.tsx"
    echo "Deleted: tmp/ConsolidatedUserProfile.tsx"
else
    echo "Not found (skipping): tmp/ConsolidatedUserProfile.tsx"
fi
if [ -f "tmp/PortfolioCommander.tsx" ]; then
    git rm -f "tmp/PortfolioCommander.tsx"
    echo "Deleted: tmp/PortfolioCommander.tsx"
else
    echo "Not found (skipping): tmp/PortfolioCommander.tsx"
fi
if [ -f "tmp/RiskEngineInterface.tsx" ]; then
    git rm -f "tmp/RiskEngineInterface.tsx"
    echo "Deleted: tmp/RiskEngineInterface.tsx"
else
    echo "Not found (skipping): tmp/RiskEngineInterface.tsx"
fi
if [ -f "frontend/src/pages/Settings.tsx" ]; then
    git rm -f "frontend/src/pages/Settings.tsx"
    echo "Deleted: frontend/src/pages/Settings.tsx"
else
    echo "Not found (skipping): frontend/src/pages/Settings.tsx"
fi
if [ -f "tmp/SettingsTest.tsx" ]; then
    git rm -f "tmp/SettingsTest.tsx"
    echo "Deleted: tmp/SettingsTest.tsx"
else
    echo "Not found (skipping): tmp/SettingsTest.tsx"
fi
if [ -f "tmp/SimpleSettings.tsx" ]; then
    git rm -f "tmp/SimpleSettings.tsx"
    echo "Deleted: tmp/SimpleSettings.tsx"
else
    echo "Not found (skipping): tmp/SimpleSettings.tsx"
fi
if [ -f "tmp/UltimateOpportunityScanner.tsx" ]; then
    git rm -f "tmp/UltimateOpportunityScanner.tsx"
    echo "Deleted: tmp/UltimateOpportunityScanner.tsx"
else
    echo "Not found (skipping): tmp/UltimateOpportunityScanner.tsx"
fi
if [ -f "frontend/src/components/user-friendly/__mocks__/UserFriendlyApp.tsx" ]; then
    git rm -f "frontend/src/components/user-friendly/__mocks__/UserFriendlyApp.tsx"
    echo "Deleted: frontend/src/components/user-friendly/__mocks__/UserFriendlyApp.tsx"
else
    echo "Not found (skipping): frontend/src/components/user-friendly/__mocks__/UserFriendlyApp.tsx"
fi
if [ -f "tmp/UserFriendlyApp_fixed.tsx" ]; then
    git rm -f "tmp/UserFriendlyApp_fixed.tsx"
    echo "Deleted: tmp/UserFriendlyApp_fixed.tsx"
else
    echo "Not found (skipping): tmp/UserFriendlyApp_fixed.tsx"
fi
if [ -f "tmp/UserFriendlyDashboard_Production.tsx" ]; then
    git rm -f "tmp/UserFriendlyDashboard_Production.tsx"
    echo "Deleted: tmp/UserFriendlyDashboard_Production.tsx"
else
    echo "Not found (skipping): tmp/UserFriendlyDashboard_Production.tsx"
fi
if [ -f "frontend/src/services/__tests__/PropOllama.test.tsx" ]; then
    git rm -f "frontend/src/services/__tests__/PropOllama.test.tsx"
    echo "Deleted: frontend/src/services/__tests__/PropOllama.test.tsx"
else
    echo "Not found (skipping): frontend/src/services/__tests__/PropOllama.test.tsx"
fi
if [ -f "tests/unit/components/Dashboard.test.tsx" ]; then
    git rm -f "tests/unit/components/Dashboard.test.tsx"
    echo "Deleted: tests/unit/components/Dashboard.test.tsx"
else
    echo "Not found (skipping): tests/unit/components/Dashboard.test.tsx"
fi

echo "Deletion phase complete."
