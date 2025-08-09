import React, { useState, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import EnhancedNavigation from '../navigation/EnhancedNavigation';
import PropOllamaContainer from '../containers/PropOllamaContainer';
import OptimizedPropOllamaContainer from '../optimized/OptimizedPropOllamaContainer';

// Lazy load enhanced components with PropFinder-killer features
const PropFinderKillerDashboard = React.lazy(() => import('../modern/PropFinderKillerDashboard'));
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
const CheatsheetsDashboard = React.lazy(() => import('../features/cheatsheets/CheatsheetsDashboard'));
const KellyCalculator = React.lazy(() => import('../features/risk/KellyCalculator'));
const PropFinderCompetitorDashboard = React.lazy(() => import('../welcome/PropFinderCompetitorDashboard'));
const SuccessMetricsPage = React.lazy(() => import('../features/testimonials/SuccessMetricsPage'));

// NEW: Roadmap Phase 4 components
const AdvancedPlayerDashboard = React.lazy(() => import('../enhanced/AdvancedPlayerDashboard'));
const RealTimePlayerLookup = React.lazy(() => import('../search/RealTimePlayerLookup'));
const MatchupAnalysisTools = React.lazy(() => import('../analysis/MatchupAnalysisTools'));

// NEW: Phase 2 Data Ecosystem Dashboard
const DataEcosystemDashboard = React.lazy(() => import('../data-ecosystem/DataEcosystemDashboard'));

// NEW: Phase 3 Advanced AI Dashboard
const AdvancedAIDashboard = React.lazy(() => import('../ai/AdvancedAIDashboard'));

const UserFriendlyApp: React.FC = () => {
  const location = useLocation();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [useOptimizedMode, setUseOptimizedMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white'>
      {/* Enhanced Navigation */}
      <EnhancedNavigation
        isOpen={navigationOpen}
        onToggle={() => setNavigationOpen(!navigationOpen)}
        onClose={() => setNavigationOpen(false)}
      />

      {/* Main content with proper spacing */}
      <div className='w-full'>
        <div className='min-h-screen'>
          <React.Suspense
            fallback={
              <div className='flex items-center justify-center h-64'>
                <div className='relative'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400'></div>
                  <div className='absolute inset-0 rounded-full border-t-2 border-purple-400 animate-spin' style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
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
              <Route
                path='/prop-killer'
                element={<PropFinderKillerDashboard />}
              />
              <Route
                path='/mobile-research'
                element={<MobilePropResearch />}
              />
              <Route
                path='/money-maker'
                element={<UltimateMoneyMaker />}
              />

              {/* Player Research Routes */}
              <Route
                path='/player/:playerId?'
                element={<EnhancedPlayerDashboard />}
              />
              <Route
                path='/prop-scanner'
                element={isMobile ? <MobilePropResearch /> : <PropFinderKillerDashboard />}
              />
              <Route
                path='/matchup-analyzer'
                element={<EnhancedPlayerDashboard />}
              />
              <Route
                path='/injury-tracker'
                element={<EnhancedPlayerDashboard />}
              />

              {/* Tools Routes */}
              <Route path='/arbitrage' element={<ArbitrageOpportunities />} />
              <Route path='/kelly-calculator' element={<KellyCalculator />} />
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

              {/* Roadmap Phase 4 Routes */}
              <Route path='/advanced-player' element={<AdvancedPlayerDashboard />} />
              <Route path='/player-lookup' element={<RealTimePlayerLookup />} />
              <Route path='/matchup-analysis' element={<MatchupAnalysisTools />} />

              {/* Legacy Routes */}
              <Route
                path='/legacy-propollama'
                element={useOptimizedMode ? <OptimizedPropOllamaContainer /> : <PropOllamaContainer />}
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
};

export default UserFriendlyApp;
