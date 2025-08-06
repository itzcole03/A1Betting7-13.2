import { BarChart3, Brain, Home, Menu, Target, TrendingUp, User, X, Zap } from 'lucide-react';
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
const PlayerDashboard = React.lazy(() => import('../player/PlayerDashboardContainer'));
const PlayerDashboardTest = React.lazy(() => import('../../pages/PlayerDashboardTest'));

const UserFriendlyApp: React.FC = () => {
  console.count('[UserFriendlyApp] RENDER');
  console.error('[UserFriendlyApp] *** COMPONENT MOUNTING *** - PATH:', window.location.pathname);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  const [useOptimizedMode, setUseOptimizedMode] = useState(false); // Toggle for optimization

  const navigation = [
    { name: 'Sports Analytics', href: '/', icon: Home, current: location.pathname === '/' },
    {
      name: 'Player Research',
      href: '/player',
      icon: User,
      current: location.pathname.startsWith('/player'),
    },
    {
      name: 'Dashboard Test',
      href: '/test-dashboard',
      icon: Zap,
      current: location.pathname === '/test-dashboard',
    },
    {
      name: 'AI/ML Models',
      href: '/ml-models',
      icon: Brain,
      current: location.pathname === '/ml-models',
    },
    {
      name: 'Betting Interface',
      href: '/betting',
      icon: BarChart3,
      current: location.pathname === '/betting',
    },
    {
      name: 'Arbitrage',
      href: '/arbitrage',
      icon: Target,
      current: location.pathname === '/arbitrage',
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
          <div className='flex items-center justify-center h-16 bg-slate-900/50 border-b border-slate-600'>
            <div className='flex items-center space-x-2'>
              <Zap className='h-8 w-8 text-yellow-400' />
              <span className='text-xl font-bold'>A1 Betting</span>
            </div>
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
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                    item.current
                      ? 'bg-yellow-500 text-black'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className='mr-3 h-5 w-5' />
                  {item.name}
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
                <TrendingUp className='h-4 w-4 text-green-400' />
                <span className='text-sm font-medium text-green-400'>Phase 3 Active</span>
              </div>
              <div className='text-xs text-green-300 mt-1'>Enterprise AI/ML Platform</div>
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
                element={(() => {
                  console.error(
                    '[UserFriendlyApp] *** ROUTING TO HOME - useOptimizedMode:',
                    useOptimizedMode
                  );
                  return useOptimizedMode ? (
                    <OptimizedPropOllamaContainer />
                  ) : (
                    <PropOllamaContainer />
                  );
                })()}
              />
              <Route path='/player/:playerId?' element={<PlayerDashboard />} />
              <Route path='/test-dashboard' element={<PlayerDashboardTest />} />
              <Route path='/ml-models' element={<MLModelCenter />} />
              <Route path='/betting' element={<UnifiedBettingInterface />} />
              <Route path='/arbitrage' element={<ArbitrageOpportunities />} />
            </Routes>
          </React.Suspense>
        </div>
      </div>
    </div>
  );
};

export default UserFriendlyApp;
