import { BarChart3, Brain, Home, Menu, Target, TrendingUp, User, X, Zap, BookOpen, Calculator, Activity } from 'lucide-react';
import React, { useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import PropOllamaContainer from '../containers/PropOllamaContainer';
import OptimizedPropOllamaContainer from '../optimized/OptimizedPropOllamaContainer';

// Lazy load Phase 3 components
const MLModelCenter = React.lazy(() => import('../ml/MLModelCenter'));
const UnifiedBettingInterface = React.lazy(() => import('../betting/UnifiedBettingInterface'));
const ArbitrageOpportunities = React.lazy(
  () => import('../features/betting/ArbitrageOpportunities')
);
const PlayerDashboard = React.lazy(() => import('../player/PlayerDashboardWrapper'));
const EnhancedPlayerDashboard = React.lazy(() => import('../player/EnhancedPlayerDashboard'));
const PlayerDashboardTest = React.lazy(() => import('../../pages/PlayerDashboardTest'));

// NEW: PropFinder-competing features
const OddsComparison = React.lazy(() => import('../features/odds/OddsComparison'));
const CheatsheetsDashboard = React.lazy(() => import('../features/cheatsheets/CheatsheetsDashboard'));
const KellyCalculator = React.lazy(() => import('../features/risk/KellyCalculator'));
const PropFinderCompetitorDashboard = React.lazy(() => import('../welcome/PropFinderCompetitorDashboard'));

const UserFriendlyApp: React.FC = () => {
  console.count('[UserFriendlyApp] RENDER');
  console.log('[UserFriendlyApp] Rendering on path:', window.location.pathname);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  const [useOptimizedMode, setUseOptimizedMode] = useState(false); // Toggle for optimization

  const navigation = [
    { name: 'PropFinder Competitor', href: '/', icon: Home, current: location.pathname === '/', badge: 'HOME' },
    {
      name: 'Player Research',
      href: '/player',
      icon: User,
      current: location.pathname.startsWith('/player'),
      badge: null
    },
    {
      name: 'Odds Comparison',
      href: '/odds-comparison',
      icon: TrendingUp,
      current: location.pathname === '/odds-comparison',
      badge: 'NEW'
    },
    {
      name: 'Arbitrage Hunter',
      href: '/arbitrage',
      icon: Target,
      current: location.pathname === '/arbitrage',
      badge: 'HOT'
    },
    {
      name: 'Prop Cheatsheets',
      href: '/cheatsheets',
      icon: BookOpen,
      current: location.pathname === '/cheatsheets',
      badge: 'NEW'
    },
    {
      name: 'Kelly Calculator',
      href: '/kelly-calculator',
      icon: Calculator,
      current: location.pathname === '/kelly-calculator',
      badge: 'NEW'
    },
    {
      name: 'AI/ML Models',
      href: '/ml-models',
      icon: Brain,
      current: location.pathname === '/ml-models',
      badge: null
    },
    {
      name: 'Betting Interface',
      href: '/betting',
      icon: BarChart3,
      current: location.pathname === '/betting',
      badge: null
    },
    {
      name: 'Legacy PropOllama',
      href: '/legacy-propollama',
      icon: Activity,
      current: location.pathname === '/legacy-propollama',
      badge: 'LEGACY'
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
      {/* Universal sidebar toggle - visible on all screen sizes */}
      <div className='fixed top-4 left-4 z-50'>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className='bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg text-white hover:bg-slate-700 transition-all duration-200 shadow-lg border border-slate-600 hover:shadow-xl'
          title={sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
        >
          {sidebarOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-800/98 backdrop-blur-md border-r border-slate-600/50 shadow-2xl transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Logo/Header */}
          <div className='flex flex-col items-center justify-center h-20 bg-slate-900/50 border-b border-slate-600'>
            <div className='flex items-center space-x-2'>
              <Zap className='h-8 w-8 text-yellow-400' />
              <span className='text-xl font-bold'>A1 Betting</span>
            </div>
            <div className='text-xs text-gray-400 mt-1'>PropFinder Competitor</div>
          </div>

          {/* Navigation */}
          <nav className='flex-1 px-4 py-6 space-y-2'>
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors ${
                    item.current
                      ? 'bg-yellow-500 text-black'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className='flex items-center'>
                    <Icon className='mr-3 h-5 w-5' />
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      item.badge === 'NEW' ? 'bg-green-600 text-white' :
                      item.badge === 'HOT' ? 'bg-red-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Phase indicator */}
          <div className='px-4 py-4 border-t border-slate-600'>
            {/* Optimization Toggle */}
            <div className='mb-4'>
              <button
                onClick={() => setUseOptimizedMode(!useOptimizedMode)}
                className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg font-medium transition-all ${
                  useOptimizedMode
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Zap
                  className={`h-4 w-4 ${useOptimizedMode ? 'text-yellow-300' : 'text-gray-400'}`}
                />
                <span className='text-sm'>
                  {useOptimizedMode ? '⚡ Optimized Mode' : 'Standard Mode'}
                </span>
              </button>
              {useOptimizedMode && (
                <div className='text-xs text-green-300 mt-2 text-center'>
                  Performance optimization active
                </div>
              )}
            </div>

            <div className='bg-green-900 rounded-lg p-3 text-center'>
              <div className='flex items-center justify-center space-x-2'>
                <Target className='h-4 w-4 text-green-400' />
                <span className='text-sm font-medium text-green-400'>PropFinder Competitor</span>
              </div>
              <div className='text-xs text-green-300 mt-1'>AI • Odds • Arbitrage • Kelly</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-all duration-300'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className='w-full'>
        <div className='min-h-screen pt-16 px-4'>
          <React.Suspense
            fallback={
              <div className='flex items-center justify-center h-64'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400'></div>
              </div>
            }
          >
            <Routes>
              <Route
                path='/'
                element={<PropFinderCompetitorDashboard />}
              />
              <Route
                path='/legacy-propollama'
                element={(() => {
                  console.log(
                    '[UserFriendlyApp] Rendering legacy PropOllama route - useOptimizedMode:',
                    useOptimizedMode
                  );
                  return useOptimizedMode ? (
                    <OptimizedPropOllamaContainer />
                  ) : (
                    <PropOllamaContainer />
                  );
                })()}
              />
              <Route
                path='/player/:playerId?'
                element={(() => {
                  console.log('[UserFriendlyApp] Rendering Player Dashboard route');
                  return <PlayerDashboard />;
                })()}
              />

              {/* NEW PropFinder-competing features */}
              <Route
                path='/odds-comparison'
                element={<OddsComparison />}
              />
              <Route
                path='/cheatsheets'
                element={<CheatsheetsDashboard />}
              />
              <Route
                path='/kelly-calculator'
                element={<KellyCalculator />}
              />

              {/* Existing routes */}
              <Route path='/ml-models' element={<MLModelCenter />} />
              <Route path='/betting' element={<UnifiedBettingInterface />} />
              <Route path='/arbitrage' element={<ArbitrageOpportunities />} />
              <Route
                path='/test-dashboard'
                element={(() => {
                  console.log('[UserFriendlyApp] Rendering Test Dashboard route');
                  return <PlayerDashboardTest />;
                })()}
              />
            </Routes>
          </React.Suspense>
        </div>
      </div>
    </div>
  );
};

export default UserFriendlyApp;
