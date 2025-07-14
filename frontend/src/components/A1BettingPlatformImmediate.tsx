import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowUp,
  BarChart3,
  Brain,
  CheckCircle,
  Cpu,
  DollarSign,
  Home,
  Menu,
  PieChart,
  Star,
  Target,
  User,
  X,
  Zap,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

// Import components directly (no lazy loading for testing)
import { CommandSummaryProvider, useCommandSummary } from '../contexts/CommandSummaryContext';
import BettingInterface from './BettingInterface'; // Changed to default import
import Dashboard from './Dashboard'; // Assuming default export
import PredictionDisplay from './PredictionDisplay'; // Changed to default import
import UserProfile from './UserProfile'; // Changed to default import

/**
 * A1Betting Platform - Immediate Loading Version for Testing
 * All enterprise features without loading delays
 */

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<object>; // Changed from 'any' to 'object' for better typing
  badge?: string;
  description: string;
  premium?: boolean;
}

interface PlatformStats {
  totalProfit: number;
  winRate: number;
  accuracy: number;
  activePredictions: number;
  portfolioValue: number;
  todayPnL: number;
  sharpeRatio: number;
  maxDrawdown: number;
  apiHealth: 'healthy' | 'degraded' | 'critical';
  opportunitiesFound: number;
  mlModelsActive: number;
  safeNumber?: (value: number, decimals: number) => string;
}

const CommandSummarySidebar: React.FC = () => {
  const { commands, loading, error } = useCommandSummary();
  return (
    <aside
      style={{
        width: 320,
        background: '#18181b',
        color: '#fff',
        borderLeft: '1px solid #333',
        padding: 16,
        overflowY: 'auto',
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        zIndex: 100,
      }}
    >
      <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Live Command Summary</h2>
      {loading && <div>Loading commands...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {commands.map(cmd => (
          <li key={cmd.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>{cmd.name}</div>
            <div style={{ fontSize: 14, color: '#aaa' }}>{cmd.description}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

const A1BettingPlatformImmediate: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Platform statistics - Ready immediately (no loading state)
  const [stats] = useState<PlatformStats>({
    totalProfit: 18500, // 18.5% ROI as documented
    winRate: 73.8, // 73.8% Win Rate as documented
    accuracy: 85.2, // 85%+ AI Accuracy as documented
    activePredictions: 47, // 47+ ML models as documented
    portfolioValue: 125000,
    todayPnL: 2340,
    sharpeRatio: 1.42, // Excellent risk-adjusted performance as documented
    maxDrawdown: 2.3, // Conservative risk management as documented
    apiHealth: 'healthy',
    opportunitiesFound: 23,
    mlModelsActive: 47,
    safeNumber: (value: number, decimals: number) => value.toFixed(decimals),
  });

  // Navigation structure
  const navigationItems: NavigationItem[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Command Center',
        icon: <Home className='w-5 h-5' />,
        component: Dashboard,
        description: 'Live performance metrics and system overview',
      },
      {
        id: 'opportunities',
        label: 'Live Opportunities',
        icon: <Target className='w-5 h-5' />,
        component: Dashboard,
        badge: '23',
        description: 'Real-time money-making opportunities',
      },
      {
        id: 'betting',
        label: 'Betting Interface',
        icon: <DollarSign className='w-5 h-5' />,
        component: BettingInterface,
        badge: 'Live',
        description: 'Place bets with AI-powered insights',
      },
      {
        id: 'predictions',
        label: 'AI Predictions',
        icon: <Brain className='w-5 h-5' />,
        component: PredictionDisplay,
        badge: '85%',
        description: '47+ ML models with ensemble methods',
      },
      {
        id: 'arbitrage',
        label: 'Arbitrage Hunter',
        icon: <Zap className='w-5 h-5' />,
        component: Dashboard,
        badge: 'Auto',
        description: 'Cross-platform arbitrage detection',
        premium: true,
      },
      {
        id: 'analytics',
        label: 'Performance Analytics',
        icon: <BarChart3 className='w-5 h-5' />,
        component: Dashboard,
        description: 'Advanced performance tracking and insights',
      },
      {
        id: 'portfolio',
        label: 'Portfolio Manager',
        icon: <PieChart className='w-5 h-5' />,
        component: Dashboard,
        badge: '18.5%',
        description: 'Risk-adjusted portfolio management',
      },
      {
        id: 'models',
        label: 'ML Model Center',
        icon: <Cpu className='w-5 h-5' />,
        component: Dashboard,
        badge: '47+',
        description: 'Ensemble methods, deep learning, causal inference',
        premium: true,
      },
      {
        id: 'live-data',
        label: 'Live Data Feeds',
        icon: <Activity className='w-5 h-5' />,
        component: Dashboard,
        badge: 'Real-time',
        description: 'SportsRadar, TheOdds, PrizePicks APIs',
      },
      {
        id: 'profile',
        label: 'User Profile',
        icon: <User className='w-5 h-5' />,
        component: UserProfile,
        description: 'Account management and preferences',
      },
    ],
    []
  );

  const handleTabChange = useCallback((tab: string) => {
    setActiveView(tab);
    setIsMobileMenuOpen(false);
  }, []);

  const ActiveComponent =
    navigationItems.find(item => item.id === activeView)?.component || Dashboard;
  const activeItem = navigationItems.find(item => item.id === activeView);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
      {/* Mobile Header */}
      <div className='lg:hidden bg-black/20 backdrop-blur-lg border-b border-white/10 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <h1 className='text-xl font-bold text-yellow-400'>A1 Betting</h1>
            <span className='text-xs px-2 py-1 rounded-full bg-green-500/20 border-green-500/30 text-green-400'>
              Live
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='text-white hover:text-yellow-400 transition-colors'
          >
            {isMobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
          </button>
        </div>
      </div>

      <div className='flex'>
        {/* Enhanced Sidebar */}
        <AnimatePresence>
          {(isMobileMenuOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className='fixed lg:relative z-50 lg:z-auto w-80 h-full lg:h-screen bg-black/40 backdrop-blur-xl border-r border-white/10'
            >
              <div className='p-6'>
                {/* Logo & Platform Stats */}
                <div className='hidden lg:block mb-8'>
                  <h1 className='text-2xl font-bold text-yellow-400 mb-2'>A1 Betting Platform</h1>
                  <p className='text-gray-400 text-sm mb-4'>Enterprise Sports Intelligence</p>

                  {/* Live Stats Summary */}
                  <div className='grid grid-cols-2 gap-3 mb-6'>
                    <div className='bg-white/10 rounded-lg p-3 border border-white/20'>
                      <p className='text-xs text-gray-400'>Win Rate</p>
                      <p className='text-lg font-bold text-green-400'>{stats.winRate}%</p>
                    </div>
                    <div className='bg-white/10 rounded-lg p-3 border border-white/20'>
                      <p className='text-xs text-gray-400'>AI Accuracy</p>
                      <p className='text-lg font-bold text-blue-400'>{stats.accuracy}%</p>
                    </div>
                    <div className='bg-white/10 rounded-lg p-3 border border-white/20'>
                      <p className='text-xs text-gray-400'>Total Profit</p>
                      <p className='text-lg font-bold text-yellow-400'>
                        ${stats.totalProfit.toLocaleString()}
                      </p>
                    </div>
                    <div className='bg-white/10 rounded-lg p-3 border border-white/20'>
                      <p className='text-xs text-gray-400'>ML Models</p>
                      <p className='text-lg font-bold text-purple-400'>{stats.mlModelsActive}+</p>
                    </div>
                  </div>

                  {/* Advanced Performance Metrics */}
                  <div className='bg-white/5 rounded-lg p-4 mb-6 border border-white/10'>
                    <h4 className='text-sm font-semibold text-white mb-3'>Advanced Metrics</h4>
                    <div className='space-y-2 text-xs'>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Sharpe Ratio</span>
                        <span className='text-green-400 font-semibold'>{stats.sharpeRatio}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Max Drawdown</span>
                        <span className='text-yellow-400 font-semibold'>{stats.maxDrawdown}%</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Opportunities</span>
                        <span className='text-purple-400 font-semibold'>
                          {stats.opportunitiesFound}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className='space-y-2'>
                  <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3'>
                    Platform Modules
                  </h3>
                  {navigationItems.map(item => (
                    <motion.button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-left relative ${
                        activeView === item.id
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className='relative'>
                        {item.icon}
                        {item.badge && (
                          <span
                            className={`absolute -top-2 -right-2 text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                              item.badge === 'Live' || item.badge === 'Auto'
                                ? 'bg-green-500 text-white animate-pulse'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            {item.badge === 'Live' || item.badge === 'Auto' ? '●' : item.badge}
                          </span>
                        )}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center space-x-2'>
                          <p className='font-medium'>{item.label}</p>
                          {item.premium && <Star className='w-3 h-3 text-yellow-400' />}
                        </div>
                        <p className='text-xs text-gray-400 mt-1'>{item.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </nav>

                {/* System Status */}
                <div className='mt-8 p-4 bg-white/5 rounded-lg border border-white/10'>
                  <h4 className='text-sm font-semibold text-white mb-3 flex items-center'>
                    <Activity className='w-4 h-4 mr-2' />
                    System Status
                  </h4>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-gray-400'>SportsRadar API</span>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-gray-400'>75%</span>
                        <span className='w-2 h-2 rounded-full bg-green-400'></span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-gray-400'>TheOdds API</span>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-gray-400'>45%</span>
                        <span className='w-2 h-2 rounded-full bg-green-400'></span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-gray-400'>ML Models</span>
                      <span className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-gray-400'>Real-time Data</span>
                      <span className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className='flex-1 lg:ml-0'>
          {/* Enhanced Top Bar */}
          <div className='hidden lg:flex items-center justify-between p-6 border-b border-white/10 bg-black/20 backdrop-blur-lg'>
            <div>
              <h2 className='text-2xl font-bold text-white flex items-center space-x-3'>
                <span>{activeItem?.label || 'Dashboard'}</span>
                {activeItem?.premium && <Star className='w-5 h-5 text-yellow-400' />}
              </h2>
              <p className='text-gray-400 text-sm'>
                {activeItem?.description || 'Platform overview'}
              </p>
            </div>

            <div className='flex items-center space-x-6'>
              {/* Today's P&L */}
              <div className='text-right'>
                <p className='text-xs text-gray-400'>Today's P&L</p>
                <div className='flex items-center space-x-2'>
                  <p className='font-semibold text-green-400'>
                    +${stats.safeNumber?.(stats.todayPnL, 2) || stats.todayPnL.toFixed(2)}
                  </p>
                  <ArrowUp className='w-4 h-4 text-green-400' />
                </div>
              </div>

              {/* System Health Indicator */}
              <div className='flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-500/20 border-green-500/30'>
                <CheckCircle className='w-4 h-4 text-green-400' />
                <span className='text-sm font-medium text-green-400'>All Systems Live</span>
              </div>

              {/* Live Opportunities Counter */}
              <div className='flex items-center space-x-2'>
                <Target className='w-4 h-4 text-purple-400' />
                <span className='text-sm text-purple-400 font-medium'>
                  {stats.opportunitiesFound} Live Opportunities
                </span>
              </div>
            </div>
          </div>

          {/* Component Content */}
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='min-h-screen'
          >
            <ActiveComponent />
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Floating Action Button for Mobile */}
      <div className='lg:hidden fixed bottom-6 right-6 z-30'>
        <motion.button
          className='w-14 h-14 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg'
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveView('opportunities')}
        >
          <Target className='w-6 h-6 text-black' />
        </motion.button>
      </div>

      {/* Inject live command summary sidebar */}
      <CommandSummarySidebar />
    </div>
  );
};

export default (props: any) => (
  <CommandSummaryProvider>
    <A1BettingPlatformImmediate {...props} />
  </CommandSummaryProvider>
);
