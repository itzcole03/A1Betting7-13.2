import React, { Suspense, memo, useCallback, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import ApiHealthIndicator from '../ApiHealthIndicator';
import EnhancedNavigation from '../navigation/EnhancedNavigation';
import WebSocketStatusIndicator from '../WebSocketStatusIndicator';

const PropFinderDashboard =
  process.env.NODE_ENV === 'test'
    ? // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../dashboard/PropFinderDashboard').default
    : React.lazy(() => import('../dashboard/PropFinderDashboard'));
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
  const [navigationOpen, setNavigationOpen] = useState(false);

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
