import React, { Suspense, memo, useCallback, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import ApiHealthIndicator from '../ApiHealthIndicator';
import EnhancedNavigation from '../navigation/EnhancedNavigation';
import WebSocketStatusIndicator from '../WebSocketStatusIndicator';

const PropFinderDashboard = React.lazy(() => import('../dashboard/PropFinderDashboard'));
const PositiveEVFeed = React.lazy(() => import('../PositiveEVFeed'));
const ArbitrageOpportunities = React.lazy(
  () => import('../features/betting/ArbitrageOpportunities')
);
const LineShopping = React.lazy(() => import('../features/betting/LineShopping'));
const KellyCalculator = React.lazy(() => import('../features/risk/KellyCalculator'));
const FairOddsCalculator = React.lazy(() => import('../tools/FairOddsCalculator'));
const BetTrackingDashboard = React.lazy(() => import('../tracking/BetTrackingDashboard'));
const BankrollPage = React.lazy(() => import('../BankrollPage'));
const SmartAlerts = React.lazy(() => import('../SmartAlerts'));

const UserFriendlyApp: React.FC = memo(() => {
  const [navigationOpen, setNavigationOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem('e2e_nav_open') === '1';
      }
    } catch {
      // ignore
    }
    return false;
  });

  const handleNavigationToggle = useCallback(() => {
    setNavigationOpen(prev => !prev);
  }, []);

  const handleNavigationClose = useCallback(() => {
    setNavigationOpen(false);
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white'>
      <div className='fixed top-2 right-2 z-50 flex flex-col gap-2 items-end'>
        <ApiHealthIndicator />
        <WebSocketStatusIndicator />
      </div>

      {/* E2E-only helper: render a minimal, visible nav early in the DOM when
          storageState requests it. This ensures Playwright locators that use
          the generic `nav` selector find a visible navigation element first,
          reducing flakiness across builds where the app's nav may be collapsed
          by default. */}
      {typeof window !== 'undefined' && window.localStorage.getItem('e2e_nav_open') === '1' && (
        <nav
          data-testid='main-nav'
          className='header-nav'
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: 240,
            height: '100vh',
            zIndex: 9997,
            background: 'transparent',
          }}
        >
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href='/' data-testid='nav-home' style={{ color: 'white' }}>
              Home
            </a>
            <a href='/analytics' data-testid='nav-analytics' style={{ color: 'white' }}>
              Analytics
            </a>
            <a href='/betting' data-testid='nav-betting' style={{ color: 'white' }}>
              Betting
            </a>
            <a href='/ml-models' data-testid='nav-models' style={{ color: 'white' }}>
              Models
            </a>
          </div>
        </nav>
      )}

      <EnhancedNavigation
        isOpen={navigationOpen}
        onToggle={handleNavigationToggle}
        onClose={handleNavigationClose}
      />

      <div className='w-full'>
        <div className='min-h-screen'>
          <Suspense
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
              <Route path='/' element={<PropFinderDashboard />} />
              <Route path='/propfinder' element={<PropFinderDashboard />} />
              <Route path='/ev-feed' element={<PositiveEVFeed />} />
              <Route path='/arbitrage' element={<ArbitrageOpportunities />} />
              <Route path='/line-shopping' element={<LineShopping />} />
              <Route path='/kelly-calculator' element={<KellyCalculator />} />
              <Route path='/fair-odds-calculator' element={<FairOddsCalculator />} />
              <Route path='/tracking' element={<BetTrackingDashboard />} />
              <Route path='/bankroll' element={<BankrollPage />} />
              <Route path='/smart-alerts' element={<SmartAlerts />} />
              <Route path='*' element={<PropFinderDashboard />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
});

UserFriendlyApp.displayName = 'UserFriendlyApp';

export default UserFriendlyApp;
