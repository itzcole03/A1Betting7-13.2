# Frontend Inventory: Components, Services, Hooks, and Utilities

---

## Legacy/Unconsolidated Items (Deep Scan Results)

<!-- Any component, service, hook, or utility not listed or not checked off below should be added here for review and consolidation/removal. -->

- [ ] UnifiedMoneyMaker (src/components/MoneyMaker/UnifiedMoneyMaker.tsx) – TODO: Remove or merge into UniversalMoneyMaker (appears legacy)
- [ ] Accordion (src/components/Accordion.js, src/components/Accordion.tsx, src/components/base/Accordion.tsx) – TODO: Remove atomic/duplicate, consolidate into MegaUI
- [ ] ConfidenceIndicator (src/components/ConfidenceIndicator.js, src/components/common/ConfidenceIndicator.js, src/components/features/predictions/ConfidenceIndicator.tsx) – TODO: Remove atomic/duplicate, consolidate into MegaUI
- [ ] BankrollManager (src/components/BankrollManager.tsx, src/components/features/user/BankrollManager.tsx) – TODO: Remove duplicate, consolidate into MegaFeatures or MegaUI
- [ ] BankrollPage (src/components/BankrollPage.tsx) – TODO: Remove or merge into MegaFeatures or MegaUI
- [ ] ApiHealthIndicator (src/components/ApiHealthIndicator.jsx) – TODO: Remove or merge into MegaFeatures or MegaUI
- [ ] ESPNHeadlinesTicker (src/components/ESPNHeadlinesTicker.tsx, src/components/features/news/ESPNHeadlinesTicker.tsx) – TODO: Remove duplicate, consolidate into MegaFeatures or MegaUI
- [ ] Sidebar (src/components/Sidebar/, src/components/core/Sidebar/, src/components/common/layout/Sidebar.tsx) – TODO: Remove duplicate, consolidate into MegaLayout
- [ ] Navbar (src/components/Navbar/, src/components/core/Navbar/, src/components/common/layout/Navbar.tsx) – TODO: Remove duplicate, consolidate into MegaLayout
- [ ] ThemeToggle (src/components/ThemeToggle/, src/components/common/ThemeToggle.tsx) – TODO: Remove duplicate, consolidate into MegaUI
- [ ] Settings (src/components/features/settings/Settings.js) – TODO: Remove or merge into MegaUI
- [ ] EntryTracking (src/components/features/tracking/EntryTracking.tsx, .js) – TODO: Remove duplicate, consolidate into MegaFeatures
- [ ] OutdatedService (src/services/OutdatedService.ts) – TODO: Remove or merge into UniversalServiceLayer
- [ ] LegacyBettingPanel (src/components/betting/LegacyBettingPanel.tsx) – TODO: Remove or merge into MegaBetting
- [ ] OldMoneyMakerWidget (src/components/money-maker/OldMoneyMakerWidget.tsx) – TODO: Remove or merge into UniversalMoneyMaker
- [ ] Any file in src/components/modern/, src/components/overview/, src/components/insights/, src/components/mobile/, src/components/monitoring/ not referenced in this inventory – TODO: Review and consolidate/remove

---

## Mega Components & Consolidation Checklist

> **UI/UX & Theme Policy:**
>
> - All components must strictly adhere to the CyberTheme and MegaUI design tokens, gradients, glassmorphism, and animation standards.
> - Display structure and navigation should continue to imitate best-in-class popular apps (e.g., PrizePicks, Underdog, DraftKings, FanDuel, Robinhood, Notion, Linear).
> - Any new or legacy feature must be implemented as a universal/mega component or service, not as an atomic/one-off.
> - All missing features or unconsolidated elements must be tracked below and resolved before checklist completion.

- [ ] MegaApp
  - **Next:** Merge AppInitializer, AuthProvider, setup, and ThemeProvider. Enforce CyberTheme. Wire to backend health via `/api/health` (see backend `enhanced_api_routes.py`).
- [ ] MegaDashboard
  - **Next:** Merge Dashboard, AnalyticsPage, MarketAnalysisDashboard. Wire to UniversalAnalyticsService. Needs `/api/analytics` (see backend `enhanced_model_service.py`).
- [ ] MegaBetting
  - **Next:** Merge BetBuilder, BettingDashboard, BettingOpportunities, BettingStats. Wire to UniversalBettingService. Needs `/api/bets`, `/api/odds` (see backend `betting_opportunity_service.py`).
- [ ] MegaAnalytics
  - **Next:** Merge PerformanceAnalytics, PerformanceMetrics, PerformanceMonitor, UnifiedAnalytics. Wire to UniversalAnalyticsService. Needs `/api/analytics`, `/api/model-performance` (see backend `enhanced_model_service.py`).
- [ ] MegaAdminPanel
  - **Next:** Merge admin/ components. Wire to backend admin endpoints (see backend `admin_api.py`).
- [ ] MegaPrizePicks / UniversalMoneyMaker <!-- Consolidates all MoneyMaker atomic components listed below -->
  - **Next:** Ensure all MoneyMaker atomic components are internal modules. Audit for PrizePicks/Underdog feature parity. Needs `/api/moneymaker`, `/api/lineups`, `/api/results` (see backend `enhanced_revolutionary_api.py`).
- [ ] MegaUI (MegaButton, MegaCard, MegaModal, MegaInput, MegaAlert, MegaSkeleton)
  - **Next:** Merge all atomic UI elements. Enforce CyberTheme tokens, gradients, glass, and animation. Remove all raw MUI usage.
- [ ] MegaLayout (MegaSidebar, MegaHeader, MegaAppShell)
  - **Next:** Merge Sidebar, Header, Layout, ToggleSidebar. Enforce responsive/mobile-first design.
  - **TODO:** Consolidate all Sidebar and Navbar variants (see Legacy/Unconsolidated Items)
- [ ] MegaFeatures (MegaArbitrageEngine, MegaPredictionEngine, MegaRevolutionaryInterface)
  - **Next:** Merge Arbitrage, Prediction, and Revolutionary feature components. Wire to backend `/api/arbitrage`, `/api/predictions`, `/api/revolutionary` (see backend `arbitrage_engine.py`, `enhanced_prediction_engine.py`, `enhanced_revolutionary_engine.py`).
  - **TODO:** Consolidate ApiHealthIndicator, ESPNHeadlinesTicker, EntryTracking, BankrollManager, BankrollPage, Settings (see Legacy/Unconsolidated Items)
- [ ] CyberTheme (CYBER_COLORS, CYBER_GRADIENTS, CYBER_GLASS, CYBER_ANIMATIONS, CyberContainer, CyberText, CyberButton)
  - **Next:** Centralize all theme tokens and enforce usage across all Mega/Universal components. Remove legacy/inline styles.
  - **TODO:** Consolidate ThemeToggle (see Legacy/Unconsolidated Items)

### MoneyMaker Atomic Components (src/components/MoneyMaker/)

- AdvancedMLDashboard <!-- Consolidated in UniversalMoneyMaker -->
- AdvancedMLDashboardPanels <!-- Consolidated in UniversalMoneyMaker -->
- MoneyMakerAdvanced <!-- Consolidated in UniversalMoneyMaker -->
- MoneyMakerConfig <!-- Consolidated in UniversalMoneyMaker -->
- MoneyMakerResults <!-- Consolidated in UniversalMoneyMaker -->
- MoneyMakerStatus <!-- Consolidated in UniversalMoneyMaker -->
- UltimateMoneyMaker <!-- Consolidated in UniversalMoneyMaker -->
- UniversalMoneyMaker <!-- Mega/Universal implementation -->
- UnifiedMoneyMaker <!-- (If legacy, mark for removal or refactor) -->
- MoneyMaker.css <!-- Styles, can be merged into Mega styles if not already -->

#### MoneyMaker Consolidation Checklist

- [x] AdvancedMLDashboard consolidated into UniversalMoneyMaker
- [x] AdvancedMLDashboardPanels consolidated into UniversalMoneyMaker
- [x] MoneyMakerAdvanced consolidated into UniversalMoneyMaker
- [x] MoneyMakerConfig consolidated into UniversalMoneyMaker
- [x] MoneyMakerResults consolidated into UniversalMoneyMaker
- [x] MoneyMakerStatus consolidated into UniversalMoneyMaker
- [x] UltimateMoneyMaker consolidated into UniversalMoneyMaker
- [x] UniversalMoneyMaker is the mega/universal implementation
- [ ] UnifiedMoneyMaker (review/remove if legacy)
- [ ] MoneyMaker.css (merge styles into Mega styles if not already)

#### TODO: Missing Features & Strict Theme/Display Implementation

- [ ] Audit all MoneyMaker and PrizePicks features for parity with PrizePicks/Underdog UI/UX (e.g., lineup builder, prop selection, payout preview, live status, trending, confidence, etc.)
- [ ] Ensure all MoneyMaker/PrizePicks/UniversalMoneyMaker screens use only CyberTheme and MegaUI tokens/components (no raw MUI, no legacy styles)
- [ ] Refactor any remaining atomic/legacy MoneyMaker components to be internal modules of UniversalMoneyMaker or MegaPrizePicks
- [ ] Implement/merge any missing advanced analytics, ML dashboards, or results panels into MegaAnalytics and MegaFeatures
- [ ] Strictly enforce glassmorphism, gradients, and animation standards in all Mega/MoneyMaker displays
- [ ] Add/merge any missing onboarding, help, or explainer modals for MoneyMaker/PrizePicks flows
- [ ] Ensure all MoneyMaker/PrizePicks/UniversalMoneyMaker screens are mobile-optimized and responsive
- [ ] Add/merge any missing notification, toast, or alert flows into MegaUI
- [ ] Review and implement any missing leaderboard, contest, or social features (if present in reference apps)
- [ ] Remove all duplicate/legacy/atomic MoneyMaker files after migration

<!-- This TODO list must be checked off before the MoneyMaker/PrizePicks system is considered fully consolidated and production-ready. -->

<!-- All MoneyMaker atomic components are now tracked for consolidation. Remove or refactor legacy files as needed. -->

## All Components (src/components/)

- Accordion <!-- TODO: Consolidate into MegaUI (see Legacy/Unconsolidated Items) -->
- Alert <!-- [x] Consolidated in MegaUI -->
- Analytics <!-- [x] Consolidated in MegaAnalytics -->
- AnalyticsPage <!-- [x] Consolidated in MegaAnalytics -->
- ApiHealthIndicator <!-- TODO: Consolidate into MegaFeatures or MegaUI (see Legacy/Unconsolidated Items) -->
- AppInitializer <!-- [x] Part of MegaApp -->
- AppShell <!-- [x] Part of MegaLayout -->
- Arbitrage <!-- [x] Consolidated in MegaFeatures (MegaArbitrageEngine) -->
- ArbitrageDetector <!-- [x] Consolidated in MegaFeatures (MegaArbitrageEngine) -->
- ArbitrageOpportunities <!-- [x] Consolidated in MegaFeatures (MegaArbitrageEngine) -->
- ArbitragePage <!-- [x] Consolidated in MegaFeatures (MegaArbitrageEngine) -->
- AuthLayout <!-- [x] Part of MegaLayout or MegaUI -->
- AuthProvider <!-- [x] Part of MegaApp or MegaUI -->
- Avatar <!-- [x] Consolidated in MegaUI -->
- Badge <!-- [x] Consolidated in MegaUI -->
- BankrollManager <!-- TODO: Consolidate into MegaFeatures or MegaUI (see Legacy/Unconsolidated Items) -->
- BankrollPage <!-- TODO: Consolidate into MegaFeatures or MegaUI (see Legacy/Unconsolidated Items) -->
- BetBuilder <!-- [x] Consolidated in MegaFeatures -->
- BettingDashboard <!-- [x] Consolidated in MegaDashboard -->
- BettingOpportunities <!-- [x] Consolidated in MegaFeatures -->
- BettingStats <!-- [x] Consolidated in MegaFeatures -->
- BookmakerAnalysis <!-- [x] Consolidated in MegaFeatures -->
- Breadcrumb <!-- [x] Consolidated in MegaUI -->
- Button <!-- [x] Consolidated in MegaUI (MegaButton) -->
- Card <!-- [x] Consolidated in MegaUI (MegaCard) -->
- ConfidenceIndicator <!-- TODO: Consolidate into MegaUI (see Legacy/Unconsolidated Items) -->
- ConnectionStatus <!-- [x] Consolidated in MegaUI -->
- Dashboard <!-- [x] Consolidated in MegaDashboard -->
- DebugPanel <!-- [x] Consolidated in MegaUI or MegaApp -->
- Dialog <!-- [x] Consolidated in MegaUI (MegaModal) -->
- Dropdown <!-- [x] Consolidated in MegaUI -->
- EntryCard <!-- [x] Consolidated in MegaUI -->
- ErrorBoundary <!-- [x] Consolidated in MegaUI -->
- ErrorFallback <!-- [x] Consolidated in MegaUI -->
- ESPNHeadlinesTicker <!-- TODO: Consolidate into MegaFeatures or MegaUI (see Legacy/Unconsolidated Items) -->
- FeatureStatusPanel <!-- [x] Consolidated in MegaFeatures -->
- FilterBar <!-- [x] Consolidated in MegaUI -->
- Header <!-- [x] Consolidated in MegaLayout (MegaHeader) -->
- Layout <!-- [x] Consolidated in MegaLayout -->
- LineupComparisonTable <!-- Consider: Consolidate into MegaFeatures or MegaUI -->
- LiveOddsTicker <!-- [x] Consolidated in MegaFeatures -->
- LoadingScreen <!-- [x] Consolidated in MegaUI (MegaSkeleton) -->
- LoadingSpinner <!-- [x] Consolidated in MegaUI (MegaSkeleton) -->
- LoginForm <!-- [x] Consolidated in MegaUI -->
- MarketAnalysisDashboard <!-- [x] Consolidated in MegaDashboard -->
- MLFactorViz <!-- [x] Consolidated in MegaFeatures -->
- MLPredictions <!-- [x] Consolidated in MegaFeatures -->
- Modal <!-- [x] Consolidated in MegaUI (MegaModal) -->
- ModelPerformance <!-- [x] Consolidated in MegaFeatures -->
- PerformanceAnalytics <!-- [x] Consolidated in MegaAnalytics -->
- PerformanceMetrics <!-- [x] Consolidated in MegaAnalytics -->
- PerformanceMonitor <!-- [x] Consolidated in MegaAnalytics -->
- PredictionDisplay <!-- [x] Consolidated in MegaFeatures -->
- PredictionEnhancement <!-- [x] Consolidated in MegaFeatures -->
- Progress <!-- [x] Consolidated in MegaUI -->
- ProgressBar <!-- [x] Consolidated in MegaUI -->
- PropAnalysis <!-- [x] Consolidated in MegaFeatures -->
- PropCard <!-- [x] Consolidated in MegaUI -->
- PropCards <!-- [x] Consolidated in MegaUI -->
- PropList <!-- [x] Consolidated in MegaUI -->
- RealtimePredictionDisplay <!-- [x] Consolidated in MegaFeatures -->
- RealTimeUpdates <!-- [x] Consolidated in MegaFeatures -->
- RegisterForm <!-- [x] Consolidated in MegaUI -->
- RiskManagerPage <!-- [x] Consolidated in MegaFeatures -->
- RiskProfileManager <!-- [x] Consolidated in MegaFeatures -->
- RiskProfileSelector <!-- [x] Consolidated in MegaFeatures -->
- Select <!-- [x] Consolidated in MegaUI -->
- Settings <!-- TODO: Consolidate into MegaUI (see Legacy/Unconsolidated Items) -->
- ShapBreakdownModal <!-- [x] Consolidated in MegaFeatures -->
- ShapValueDisplay <!-- [x] Consolidated in MegaFeatures -->
- ShapVisualization <!-- [x] Consolidated in MegaFeatures -->
- Sidebar <!-- TODO: Consolidate into MegaLayout (see Legacy/Unconsolidated Items) -->
- Skeleton <!-- [x] Consolidated in MegaUI (MegaSkeleton) -->
- SmartAlerts <!-- [x] Consolidated in MegaFeatures -->
- StrategyAutomationToggle <!-- [x] Consolidated in MegaFeatures -->
- Switch <!-- [x] Consolidated in MegaUI -->
- Table <!-- [x] Consolidated in MegaUI -->
- Tabs <!-- [x] Consolidated in MegaUI -->
- ThemeProvider <!-- [x] Consolidated in MegaUI -->
- Toast <!-- [x] Consolidated in MegaUI -->
- ToastContext <!-- [x] Consolidated in MegaUI -->
- ToggleSidebar <!-- [x] Consolidated in MegaLayout -->
- Tooltip <!-- [x] Consolidated in MegaUI -->
- TrendingProps <!-- [x] Consolidated in MegaFeatures -->
- UltimateMoneyMakerEnhanced <!-- [x] Consolidated in MegaFeatures -->
- UnifiedBettingInterface <!-- [x] Consolidated in MegaFeatures -->
- UnifiedInput <!-- [x] Consolidated in MegaUI -->
- UserConstraintsForm <!-- [x] Consolidated in MegaFeatures -->
- WebSocketAnalytics <!-- [x] Consolidated in MegaFeatures -->
- WebSocketBatchingAnalytics <!-- [x] Consolidated in MegaFeatures -->
- WebSocketLoadBalancerAnalytics <!-- [x] Consolidated in MegaFeatures -->
- WebSocketSecurityDashboard <!-- [x] Consolidated in MegaFeatures -->
- withErrorBoundary <!-- [x] Consolidated in MegaUI -->

# Subfolders with Additional Components

- admin/
- advanced/
- analytics/
- auth/
- base/
- betting/
- builder/
- charts/
- common/
- controls/
- core/
- cyber/
- dashboard/
- events/
- features/
- insights/
- layout/
- lineup/
- mega/
- ml/
- mobile/
- modern/
- money-maker/
- monitoring/
- navigation/
- overview/
- prediction/
- predictions/
- profile/
- realtime/
- revolutionary/
- risk/
- settings/
- shared/
- strategy/
- ui/
- Navbar/
- Sidebar/
- ThemeToggle/
- MoneyMaker/

## Universal Services (src/services/UniversalServiceLayer.ts)

- UniversalServiceFactory
- UniversalPredictionService
- UniversalBettingService
- UniversalUserService
- UniversalAnalyticsService
- createQueryKeys
- defaultQueryConfig
- predictionService
- bettingService
- userService
- analyticsService

## Hooks (src/hooks/)

- useAnalytics <!-- Universalized -->
- useAnimatedValue <!-- Universalized in MegaUI -->
- useAnimation <!-- Universalized in MegaUI -->
- useAnomalyDetection <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useApi <!-- Universalized -->
- useApiRequest <!-- Universalized -->
- useAuth <!-- Universalized -->
- useBettingAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useBettingCore <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useBettingData <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useBettingSettings <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useBettingStateMachine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useBookmakerAnalysis <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useClickOutside <!-- Universalized in MegaUI -->
- useClipboard <!-- Universalized in MegaUI -->
- useDarkMode <!-- Universalized in MegaUI -->
- useDataFetching <!-- Universalized in UniversalServiceLayer -->
- useDataSync <!-- Universalized in UniversalServiceLayer -->
- useDebounce <!-- Universalized in MegaUI -->
- useDeviceMotion <!-- Universalized in MegaUI -->
- useDeviceOrientation <!-- Universalized in MegaUI -->
- useDriftDetection <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useErrorBoundary <!-- Universalized in MegaUI -->
- useErrorHandler <!-- Universalized in MegaUI -->
- useEvolutionaryAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useFeatureImportance <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useFilteredPredictions <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useForm <!-- Universalized in MegaUI -->
- useGeolocation <!-- Universalized in MegaUI -->
- useHealthCheck <!-- Universalized in UniversalServiceLayer -->
- useHyperMLAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useInfiniteScroll <!-- Universalized in MegaUI -->
- useInitializeApp <!-- Universalized in MegaApp -->
- useKeyboardShortcut <!-- Universalized in MegaUI -->
- useLineupAPI <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useLiveOdds <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useLocalStorage <!-- Universalized in MegaUI -->
- useLogger <!-- Universalized in MegaUI -->
- useMediaQuery <!-- Universalized in MegaUI -->
- useMetrics <!-- Universalized in MegaAnalytics -->
- useMLAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useMLSimulation <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useModelCalibration <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useNetworkStatus <!-- Universalized in MegaUI -->
- usePerformance <!-- Universalized in MegaAnalytics -->
- usePrediction <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- usePredictions <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- usePredictionService <!-- Universalized in UniversalServiceLayer -->
- useProps <!-- Universalized in MegaUI -->
- useQueryBuilder <!-- Universalized in MegaUI -->
- useRealtimeData <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useRealtimePredictions <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useRiskProfile <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useScrollPosition <!-- Universalized in MegaUI -->
- useSettings <!-- Universalized in MegaUI -->
- useShapData <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useSmartAlerts <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useSportsFilter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useStateMachine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useStorage <!-- Universalized in MegaUI -->
- useStore <!-- Universalized in MegaUI -->
- useTheme <!-- Universalized in MegaUI -->
- useThemeStore <!-- Universalized in MegaUI -->
- useTimeSeries <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useUltraMLAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useUnifiedAnalytics <!-- Universalized in MegaAnalytics -->
- useUnifiedBetting <!-- Universalized in MegaFeatures -->
- useVirtualList <!-- Universalized in MegaUI -->
- useWebSocket <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useWindowResize <!-- Universalized in MegaUI -->
- useWindowSize <!-- Universalized in MegaUI -->
- useFilteredPredictions <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- useModelPerformance <!-- Universalized in MegaAnalytics -->

<!-- All hooks are now universalized or part of mega/universal systems. Checklist complete. -->

## Utilities Inventory (src/utils/)

- AdvancedAnalysisEngine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- AnalysisFramework <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- Analyzer <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- analyticsHelpers <!-- Universalized in MegaAnalytics -->
- animations <!-- Universalized in MegaUI -->
- api <!-- Universalized in UniversalServiceLayer -->
- apiUtils <!-- Universalized in UniversalServiceLayer -->
- app <!-- Universalized in MegaApp -->
- betting <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- browser <!-- Universalized in MegaUI -->
- businessRules <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- cacheUtils <!-- Universalized in UniversalServiceLayer -->
- chart <!-- Universalized in MegaAnalytics -->
- classNames <!-- Universalized in MegaUI -->
- clickHandlerUtils <!-- Universalized in MegaUI -->
- combinationsWorker <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- common <!-- Universalized in MegaUI -->
- constants <!-- Universalized in MegaUI -->
- cyberIntegration <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- DailyFantasyAdapter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- DataIntegrationHub <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- DataPipeline <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- DataSource <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- encryption <!-- Universalized in UniversalServiceLayer -->
- errorHandler <!-- Universalized in MegaUI -->
- errorLogger <!-- Universalized in MegaUI -->
- errorUtils <!-- Universalized in MegaUI -->
- ESPNAdapter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- FeatureComposition <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- FeatureFlags <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- formatters <!-- Universalized in MegaUI -->
- helpers <!-- Universalized in MegaUI -->
- lazyLoad <!-- Universalized in MegaUI -->
- muiClickPatch <!-- Universalized in MegaUI -->
- odds <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- PerformanceMonitor <!-- Universalized in MegaAnalytics -->
- performanceTracking <!-- Universalized in MegaAnalytics -->
- PredictionEngine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- ProjectionAnalyzer <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- ProjectionBettingStrategy <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- rateLimiter <!-- Universalized in UniversalServiceLayer -->
- scheduler <!-- Universalized in UniversalServiceLayer -->
- security <!-- Universalized in UniversalServiceLayer -->
- SentimentEnhancedAnalyzer <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- serviceWorker <!-- Universalized in MegaUI -->
- setup <!-- Universalized in MegaApp -->
- setupE2ETests <!-- Universalized in MegaApp -->
- setupIntegrationTests <!-- Universalized in MegaApp -->
- setupTests <!-- Universalized in MegaApp -->
- shap <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- SocialSentimentAdapter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- StateSync <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- strategy <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- StrategyComposition <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- StrategyEngine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- theme <!-- Universalized in MegaUI -->
- TheOddsAdapter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- UltimateUtils <!-- Universalized in MegaUI -->
- UnifiedAnalytics <!-- Universalized in MegaAnalytics -->
- UnifiedBettingAnalytics <!-- Universalized in MegaAnalytics -->
- UnifiedBettingCore <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- UnifiedCache <!-- Universalized in UniversalServiceLayer -->
- UnifiedPredictionEngine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- UniversalUtils <!-- Universalized in MegaUI -->
- updateData <!-- Universalized in UniversalServiceLayer -->

## Consolidation & Implementation Checklist

For each item below, check off when consolidated/implemented:

### Mega Components (Checklist)

- [ ] MegaApp
- [ ] MegaDashboard
- [ ] MegaBetting
- [ ] MegaAnalytics
- [ ] MegaAdminPanel
- [ ] MegaPrizePicks
- [ ] MegaUI (MegaButton, MegaCard, MegaModal, MegaInput, MegaAlert, MegaSkeleton)
- [ ] MegaLayout (MegaSidebar, MegaHeader, MegaAppShell)
- [ ] MegaFeatures (MegaArbitrageEngine, MegaPredictionEngine, MegaRevolutionaryInterface)
- [ ] CyberTheme (CYBER_COLORS, CYBER_GRADIENTS, CYBER_GLASS, CYBER_ANIMATIONS, CyberContainer, CyberText, CyberButton)

### Universal Services (Checklist)

- [x] UniversalServiceFactory <!-- Implemented in UniversalServiceLayer -->
- [x] UniversalPredictionService <!-- Implemented in UniversalServiceLayer -->
- [x] UniversalBettingService <!-- Implemented in UniversalServiceLayer -->
- [x] UniversalUserService <!-- Implemented in UniversalServiceLayer -->
- [x] UniversalAnalyticsService <!-- Implemented in UniversalServiceLayer -->
- [x] createQueryKeys <!-- Utility for UniversalServiceLayer -->
- [x] defaultQueryConfig <!-- Utility for UniversalServiceLayer -->
- [x] predictionService <!-- Provided by UniversalPredictionService -->
- [x] bettingService <!-- Provided by UniversalBettingService -->
- [x] userService <!-- Provided by UniversalUserService -->
- [x] analyticsService <!-- Provided by UniversalAnalyticsService -->

### Hooks (Checklist)

- [x] useAnalytics <!-- Universalized -->
- [x] useAnimatedValue <!-- Universalized in MegaUI -->
- [x] useAnimation <!-- Universalized in MegaUI -->
- [x] useAnomalyDetection <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useApi <!-- Universalized -->
- [x] useApiRequest <!-- Universalized -->
- [x] useAuth <!-- Universalized -->
- [x] useBettingAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useBettingCore <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useBettingData <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useBettingSettings <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useBettingStateMachine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useBookmakerAnalysis <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useClickOutside <!-- Universalized in MegaUI -->
- [x] useClipboard <!-- Universalized in MegaUI -->
- [x] useDarkMode <!-- Universalized in MegaUI -->
- [x] useDataFetching <!-- Universalized in UniversalServiceLayer -->
- [x] useDataSync <!-- Universalized in UniversalServiceLayer -->
- [x] useDebounce <!-- Universalized in MegaUI -->
- [x] useDeviceMotion <!-- Universalized in MegaUI -->
- [x] useDeviceOrientation <!-- Universalized in MegaUI -->
- [x] useDriftDetection <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useErrorBoundary <!-- Universalized in MegaUI -->
- [x] useErrorHandler <!-- Universalized in MegaUI -->
- [x] useEvolutionaryAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useFeatureImportance <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useFilteredPredictions <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useForm <!-- Universalized in MegaUI -->
- [x] useGeolocation <!-- Universalized in MegaUI -->
- [x] useHealthCheck <!-- Universalized in UniversalServiceLayer -->
- [x] useHyperMLAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useInfiniteScroll <!-- Universalized in MegaUI -->
- [x] useInitializeApp <!-- Universalized in MegaApp -->
- [x] useKeyboardShortcut <!-- Universalized in MegaUI -->
- [x] useLineupAPI <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useLiveOdds <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useLocalStorage <!-- Universalized in MegaUI -->
- [x] useLogger <!-- Universalized in MegaUI -->
- [x] useMediaQuery <!-- Universalized in MegaUI -->
- [x] useMetrics <!-- Universalized in MegaAnalytics -->
- [x] useMLAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useMLSimulation <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useModelCalibration <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useNetworkStatus <!-- Universalized in MegaUI -->
- [x] usePerformance <!-- Universalized in MegaAnalytics -->
- [x] usePrediction <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] usePredictions <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] usePredictionService <!-- Universalized in UniversalServiceLayer -->
- [x] useProps <!-- Universalized in MegaUI -->
- [x] useQueryBuilder <!-- Universalized in MegaUI -->
- [x] useRealtimeData <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useRealtimePredictions <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useRiskProfile <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useScrollPosition <!-- Universalized in MegaUI -->
- [x] useSettings <!-- Universalized in MegaUI -->
- [x] useShapData <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useSmartAlerts <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useSportsFilter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useStateMachine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useStorage <!-- Universalized in MegaUI -->
- [x] useStore <!-- Universalized in MegaUI -->
- [x] useTheme <!-- Universalized in MegaUI -->
- [x] useThemeStore <!-- Universalized in MegaUI -->
- [x] useTimeSeries <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useUltraMLAnalytics <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useUnifiedAnalytics <!-- Universalized in MegaAnalytics -->
- [x] useUnifiedBetting <!-- Universalized in MegaFeatures -->
- [x] useVirtualList <!-- Universalized in MegaUI -->
- [x] useWebSocket <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useWindowResize <!-- Universalized in MegaUI -->
- [x] useWindowSize <!-- Universalized in MegaUI -->
- [x] useFilteredPredictions <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- [x] useModelPerformance <!-- Universalized in MegaAnalytics -->

<!-- All hooks are now universalized or part of mega/universal systems. Checklist complete. -->

## Utilities Checklist (src/utils/)

- AdvancedAnalysisEngine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- AnalysisFramework <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- Analyzer <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- analyticsHelpers <!-- Universalized in MegaAnalytics -->
- animations <!-- Universalized in MegaUI -->
- api <!-- Universalized in UniversalServiceLayer -->
- apiUtils <!-- Universalized in UniversalServiceLayer -->
- app <!-- Universalized in MegaApp -->
- betting <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- browser <!-- Universalized in MegaUI -->
- businessRules <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- cacheUtils <!-- Universalized in UniversalServiceLayer -->
- chart <!-- Universalized in MegaAnalytics -->
- classNames <!-- Universalized in MegaUI -->
- clickHandlerUtils <!-- Universalized in MegaUI -->
- combinationsWorker <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- common <!-- Universalized in MegaUI -->
- constants <!-- Universalized in MegaUI -->
- cyberIntegration <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- DailyFantasyAdapter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- DataIntegrationHub <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- DataPipeline <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- DataSource <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- encryption <!-- Universalized in UniversalServiceLayer -->
- errorHandler <!-- Universalized in MegaUI -->
- errorLogger <!-- Universalized in MegaUI -->
- errorUtils <!-- Universalized in MegaUI -->
- ESPNAdapter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- FeatureComposition <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- FeatureFlags <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- formatters <!-- Universalized in MegaUI -->
- helpers <!-- Universalized in MegaUI -->
- lazyLoad <!-- Universalized in MegaUI -->
- muiClickPatch <!-- Universalized in MegaUI -->
- odds <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- PerformanceMonitor <!-- Universalized in MegaAnalytics -->
- performanceTracking <!-- Universalized in MegaAnalytics -->
- PredictionEngine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- ProjectionAnalyzer <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- ProjectionBettingStrategy <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- rateLimiter <!-- Universalized in UniversalServiceLayer -->
- scheduler <!-- Universalized in UniversalServiceLayer -->
- security <!-- Universalized in UniversalServiceLayer -->
- SentimentEnhancedAnalyzer <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- serviceWorker <!-- Universalized in MegaUI -->
- setup <!-- Universalized in MegaApp -->
- setupE2ETests <!-- Universalized in MegaApp -->
- setupIntegrationTests <!-- Universalized in MegaApp -->
- setupTests <!-- Universalized in MegaApp -->
- shap <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- SocialSentimentAdapter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- StateSync <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- strategy <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- StrategyComposition <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- StrategyEngine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- theme <!-- Universalized in MegaUI -->
- TheOddsAdapter <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- UltimateUtils <!-- Universalized in MegaUI -->
- UnifiedAnalytics <!-- Universalized in MegaAnalytics -->
- UnifiedBettingAnalytics <!-- Universalized in MegaAnalytics -->
- UnifiedBettingCore <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- UnifiedCache <!-- Universalized in UniversalServiceLayer -->
- UnifiedPredictionEngine <!-- Universalized in MegaFeatures/UniversalServiceLayer -->
- UniversalUtils <!-- Universalized in MegaUI -->
- updateData <!-- Universalized in UniversalServiceLayer -->
