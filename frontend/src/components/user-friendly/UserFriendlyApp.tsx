import React, { memo, useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import ApiHealthIndicator from '../ApiHealthIndicator';
import PropOllamaContainer from '../containers/PropOllamaContainer';
import EnhancedNavigation from '../navigation/EnhancedNavigation';
import OptimizedPropOllamaContainer from '../optimized/OptimizedPropOllamaContainer';
import WebSocketStatusIndicator from '../WebSocketStatusIndicator';

// Lazy load enhanced components with PropFinder-killer features
const PropFinderKillerDashboard = React.lazy(() => import('../modern/OptimizedPropFinderDashboard'));
const MobilePropResearch = React.lazy(() => import('../mobile/MobilePropResearch'));
const MLModelCenter = React.lazy(() => import('../ml/MLModelCenter'));
const UnifiedBettingInterface = React.lazy(() => import('../betting/UnifiedBettingInterface'));
const ArbitrageOpportunities = React.lazy(
  () => import('../features/betting/ArbitrageOpportunities')
);
const PlayerDashboard = React.lazy(() => import('../player/PlayerDashboardWrapper'));
const EnhancedPlayerDashboard = React.lazy(() => import('../player/EnhancedPlayerDashboard'));
const BetTrackingDashboard = React.lazy(() => import('../tracking/BetTrackingDashboard'));
const PlayerDashboardTest = React.lazy(() => import('../../pages/PlayerDashboardTest'));
const UltimateMoneyMaker = React.lazy(() => import('../MoneyMaker/UltimateMoneyMaker'));

// NEW: PropFinder-competing features
const OddsComparison = React.lazy(() => import('../features/odds/OddsComparison'));
const CheatsheetsDashboard = React.lazy(
  () => import('../features/cheatsheets/CheatsheetsDashboard')
);
const KellyCalculator = React.lazy(() => import('../features/risk/KellyCalculator'));
const PropFinderCompetitorDashboard = React.lazy(
  () => import('../welcome/PropFinderCompetitorDashboard')
);
const SuccessMetricsPage = React.lazy(() => import('../features/testimonials/SuccessMetricsPage'));

// NEW: Roadmap Phase 4 components
const AdvancedPlayerDashboard = React.lazy(() => import('../enhanced/AdvancedPlayerDashboard'));
const RealTimePlayerLookup = React.lazy(() => import('../search/RealTimePlayerLookup'));
const MatchupAnalysisTools = React.lazy(() => import('../analysis/MatchupAnalysisTools'));

// NEW: Phase 2 Data Ecosystem Dashboard
const DataEcosystemDashboard = React.lazy(() => import('../data-ecosystem/DataEcosystemDashboard'));

// NEW: Phase 3 Advanced AI Dashboard
const AdvancedAIDashboard = React.lazy(() => import('../ai/AdvancedAIDashboard'));

// NEW: Phase 4 Live Betting Dashboard
const LiveBettingDashboard = React.lazy(() => import('../live-betting/LiveBettingDashboard'));

// NEW: Phase 4.2 Advanced Arbitrage Dashboard
const AdvancedArbitrageDashboard = React.lazy(
  () => import('../arbitrage/AdvancedArbitrageDashboard')
);

// NEW: PropFinder Clone Dashboard
const PropFinderDashboard = React.lazy(() => import('../dashboard/PropFinderDashboard'));

// NEW: Phase 4.3 Advanced Kelly Dashboard
const AdvancedKellyDashboard = React.lazy(() => import('../kelly/AdvancedKellyDashboard'));

// NEW: Phase 2 Unified Player Dashboard
const UnifiedPlayerDashboard = React.lazy(() => import('../player/UnifiedPlayerDashboard'));

// NEW: Phase 2 Unified Search Interface
const UnifiedSearchInterface = React.lazy(() => import('../search/UnifiedSearchInterface'));

// NEW: Phase 2 Interactive Charts Hub
const InteractiveChartsHub = React.lazy(() => import('../visualizations/InteractiveChartsHub'));

// NEW: Phase 3 Unified AI Predictions Dashboard
const UnifiedAIPredictionsDashboard = React.lazy(
  () => import('../ai/UnifiedAIPredictionsDashboard')
);

// Phase 3 Components
const Phase3Page = React.lazy(() => import('../../pages/Phase3Page'));

const UserFriendlyApp: React.FC = memo(() => {
  const location = useLocation();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [useOptimizedMode, setUseOptimizedMode] = useState(true); // Default to optimized mode
  const [isMobile, setIsMobile] = useState(false);

  // Memoized handlers to prevent unnecessary re-renders
  const handleNavigationToggle = useCallback(() => {
    setNavigationOpen(prev => !prev);
  }, []);

  const handleNavigationClose = useCallback(() => {
    setNavigationOpen(false);
  }, []);

  // Detect mobile device with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 100); // Debounce resize events
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white'>
      {/* Global API Health Indicator and WebSocket Status Indicator for all routes */}
      <div className='fixed top-2 right-2 z-50 flex flex-col gap-2 items-end'>
        <ApiHealthIndicator />
        <WebSocketStatusIndicator />
      </div>
      {/* Enhanced Navigation */}
      <EnhancedNavigation
        isOpen={navigationOpen}
        onToggle={handleNavigationToggle}
        onClose={handleNavigationClose}
      />

      {/* Main content with proper spacing */}
      <div className='w-full'>
        <div className='min-h-screen'>
          <React.Suspense
            fallback={
              <div className='flex items-center justify-center h-64'>
                <div className='relative'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400'></div>
                  <div
                    className='absolute inset-0 rounded-full border-t-2 border-purple-400 animate-spin'
                    style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                  ></div>
                </div>
              </div>
            }
          >
            <Routes>
              {/* PropFinder Killer Dashboard - Main Route */}
              <Route
                path='/'
                element={isMobile ? <MobilePropResearch /> : <PropFinderKillerDashboard />}
              />
              <Route path='/propfinder-clone' element={<PropFinderDashboard />} />
              <Route path='/prop-killer' element={<PropFinderKillerDashboard />} />
              <Route path='/mobile-research' element={<MobilePropResearch />} />
              <Route path='/money-maker' element={<UltimateMoneyMaker />} />

              {/* Player Research Routes */}
              <Route path='/player/:playerId?' element={<EnhancedPlayerDashboard />} />
              <Route path='/unified-player' element={<UnifiedPlayerDashboard />} />
              <Route path='/unified-search' element={<UnifiedSearchInterface />} />
              <Route path='/charts' element={<InteractiveChartsHub />} />
              <Route path='/ai-predictions' element={<UnifiedAIPredictionsDashboard />} />
              <Route
                path='/prop-scanner'
                element={isMobile ? <MobilePropResearch /> : <PropFinderKillerDashboard />}
              />
              <Route path='/matchup-analyzer' element={<EnhancedPlayerDashboard />} />
              <Route path='/injury-tracker' element={<EnhancedPlayerDashboard />} />

              {/* Tools Routes */}
              <Route path='/arbitrage' element={<ArbitrageOpportunities />} />
              <Route path='/advanced-arbitrage' element={<AdvancedArbitrageDashboard />} />
              <Route path='/kelly-calculator' element={<KellyCalculator />} />
              <Route path='/advanced-kelly' element={<AdvancedKellyDashboard />} />
              <Route path='/odds-comparison' element={<OddsComparison />} />
              <Route path='/line-tracker' element={<PropFinderKillerDashboard />} />
              <Route path='/cheatsheets' element={<CheatsheetsDashboard />} />

              {/* Analytics Routes */}
              <Route path='/tracking' element={<BetTrackingDashboard />} />
              <Route path='/ml-models' element={<MLModelCenter />} />
              <Route path='/performance' element={<BetTrackingDashboard />} />
              <Route path='/comparison' element={<SuccessMetricsPage />} />
              <Route path='/data-ecosystem' element={<DataEcosystemDashboard />} />
              <Route path='/ai-dashboard' element={<AdvancedAIDashboard />} />
              <Route path='/live-betting' element={<LiveBettingDashboard />} />

              {/* Phase 3 Unified Architecture */}
              <Route path='/phase3/*' element={<Phase3Page />} />

              {/* Roadmap Phase 4 Routes */}
              <Route path='/advanced-player' element={<AdvancedPlayerDashboard />} />
              <Route path='/player-lookup' element={<RealTimePlayerLookup />} />
              <Route path='/matchup-analysis' element={<MatchupAnalysisTools />} />

              {/* Legacy Routes */}
              <Route
                path='/legacy-propollama'
                element={
                  useOptimizedMode ? <OptimizedPropOllamaContainer /> : <PropOllamaContainer />
                }
              />
              <Route path='/betting' element={<UnifiedBettingInterface />} />
              <Route path='/test-dashboard' element={<PlayerDashboardTest />} />

              {/* Fallback to PropFinder Killer Dashboard */}
              <Route path='*' element={<PropFinderKillerDashboard />} />
            </Routes>
          </React.Suspense>
        </div>
      </div>
    </div>
  );
});

UserFriendlyApp.displayName = 'UserFriendlyApp';

export default UserFriendlyApp;
