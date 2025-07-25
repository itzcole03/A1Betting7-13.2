import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Brain,
  Briefcase,
  Clock,
  Cloud,
  Cpu,
  DollarSign,
  GraduationCap,
  Heart,
  Home,
  LineChart,
  Menu,
  MessageSquare,
  Radio,
  RefreshCw,
  Shield,
  Target,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import React, { FC, useEffect, useMemo, useState } from 'react';

// Correct relative import paths
import A1BettingPlatform from '../A1BettingPlatformImmediate';
import PrizePicksPro from '../user-friendly/PrizePicksPro';
import { MoneyMaker } from '../MoneyMaker';
import { ArbitrageScanner } from '../ArbitrageScanner';
import { LiveBetting } from '../LiveBetting';
import { MLAnalytics } from '../MLAnalytics';
import { SHAPAnalysis } from '../SHAPAnalysis';
import { QuantumAI } from '../QuantumAI';
import { SocialIntelligence } from '../SocialIntelligence';
import { BankrollManager } from '../BankrollManager';
import { InjuryTracker } from '../InjuryTracker';
import { NewsHub } from '../NewsHub';
import { WeatherStation } from '../WeatherStation';
import { AutoPilot } from '../AutoPilot';
import { AnalyticsDashboard } from '../AnalyticsDashboard';

// Dashboard Component - will be enhanced
const _Dashboard: FC = () => {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent'>
          Dashboard
        </h2>
        <p className='text-gray-400 mt-2'>
          Command Center - Platform Overview & Performance Metrics
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Win Rate</p>
              <p className='text-2xl font-bold text-green-400'>72.4%</p>
              <p className='text-xs text-green-300 mt-1'>+2.3% this week</p>
            </div>
            <Trophy className='w-8 h-8 text-green-400' />
          </div>
        </div>

        <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>Total Profit</p>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-2xl font-bold text-purple-400'>$18,420</p>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-xs text-purple-300 mt-1'>+$1,240 today</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <DollarSign className='w-8 h-8 text-purple-400' />
          </div>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>AI Accuracy</p>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-2xl font-bold text-cyan-400'>91.5%</p>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-xs text-cyan-300 mt-1'>+0.8% improvement</p>
            </div>
            <Brain className='w-8 h-8 text-cyan-400' />
          </div>
        </div>

        <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Live Opportunities</p>
              <p className='text-2xl font-bold text-yellow-400'>23</p>
              <p className='text-xs text-yellow-300 mt-1'>+7 new</p>
            </div>
            <Zap className='w-8 h-8 text-yellow-400' />
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for new features - will be fully implemented

const _StreamingHub: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>HD Streams & Real-Time Data</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
      Live Streaming
    </h2>
    <p className='text-gray-400 mt-2'>HD Streams & Real-Time Data</p>
  </div>
);

const _RiskEngine: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>Portfolio Risk Assessment</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent'>
      Risk Engine
    </h2>
    <p className='text-gray-400 mt-2'>Portfolio Risk Assessment</p>
  </div>
);

const _SportsbookManager: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>Account Management & Optimization</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent'>
      Sportsbooks
    </h2>
    <p className='text-gray-400 mt-2'>Account Management & Optimization</p>
  </div>
);

const _AutomationHub: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>Betting Automation & Rules</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent'>
      Automation Hub
    </h2>
    <p className='text-gray-400 mt-2'>Betting Automation & Rules</p>
  </div>
);

const _AlertCenter: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>Advanced Alert Management</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent'>
      Alert Center
    </h2>
    <p className='text-gray-400 mt-2'>Advanced Alert Management</p>
  </div>
);

const _Backtesting: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>Advanced Strategy Testing</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent'>
      Backtesting
    </h2>
    <p className='text-gray-400 mt-2'>Advanced Strategy Testing</p>
  </div>
);

const _Academy: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>Education & Training Center</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent'>
      A1Betting Academy
    </h2>
    <p className='text-gray-400 mt-2'>Education & Training Center</p>
  </div>
);

const _Community: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>Social Trading & Leaderboards</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent'>
      Community Hub
    </h2>
    <p className='text-gray-400 mt-2'>Social Trading & Leaderboards</p>
  </div>
);

const _HistoricalData: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>Advanced Historical Analysis</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
      Historical Data
    </h2>
    <p className='text-gray-400 mt-2'>Advanced Historical Analysis</p>
  </div>
);

const _LineupBuilder: FC = () => (
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent'>
    <p className='text-gray-400 mt-2'>Smart Lineup Optimization</p>
  <div className='space-y-6'>
    <h2 className='text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent'>
      Lineup Builder
    </h2>
    <p className='text-gray-400 mt-2'>Smart Lineup Optimization</p>
  </div>
);

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  badge?: string;
  category: string;
}

const _QuantumSportsPlatform: FC = () => {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const _navigationItems: NavigationItem[] = useMemo(
    () => [
      // Core
      {
        id: 'dashboard',
        label: 'Dashboard',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Home className='w-5 h-5' />,
        component: Dashboard,
        category: 'Core',
      },
      // Trading
      {
        id: 'moneymaker',
        label: 'Money Maker',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <DollarSign className='w-5 h-5' />,
        component: MoneyMaker,
        badge: 'HOT',
        category: 'Trading',
      },
      {
        id: 'arbitrage',
        label: 'Arbitrage',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Zap className='w-5 h-5' />,
        component: ArbitrageScanner,
        badge: 'LIVE',
        category: 'Trading',
      },
      {
        id: 'livebetting',
        label: 'Live Betting',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Radio className='w-5 h-5' />,
        component: LiveBetting,
        category: 'Trading',
      },
      {
        id: 'prizepicks-pro',
        label: 'PrizePicks Pro',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Target className='w-5 h-5' />,
        component: PrizePicksPro,
        badge: '87%',
        category: 'Trading',
      },
      {
        id: 'lineup',
        label: 'Lineup Builder',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Activity className='w-5 h-5' />,
        component: LineupBuilder,
        category: 'Trading',
      },
      // AI Engine
      {
        id: 'analytics',
        label: 'ML Analytics',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Brain className='w-5 h-5' />,
        component: MLAnalytics,
        badge: '47',
        category: 'AI Engine',
      },
      {
        id: 'predictions',
        label: 'AI Predictions',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <LineChart className='w-5 h-5' />,
        component: Dashboard, // Will update
        category: 'AI Engine',
      },
      {
        id: 'quantum',
        label: 'Quantum AI',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Cpu className='w-5 h-5' />,
        component: QuantumAI,
        badge: 'Q',
        category: 'AI Engine',
      },
      {
        id: 'shap',
        label: 'SHAP Analysis',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <BarChart3 className='w-5 h-5' />,
        component: SHAPAnalysis,
        category: 'AI Engine',
      },
      {
        id: 'historical',
        label: 'Historical Data',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Clock className='w-5 h-5' />,
        component: HistoricalData,
        category: 'AI Engine',
      },
      // Intelligence
      {
        id: 'social',
        label: 'Social Intel',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <MessageSquare className='w-5 h-5' />,
        component: SocialIntelligence,
        category: 'Intelligence',
      },
      {
        id: 'news',
        label: 'News Hub',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Award className='w-5 h-5' />,
        component: NewsHub,
        badge: 'NEW',
        category: 'Intelligence',
      },
      {
        id: 'weather',
        label: 'Weather Station',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Cloud className='w-5 h-5' />,
        component: WeatherStation,
        category: 'Intelligence',
      },
      {
        id: 'injuries',
        label: 'Injury Tracker',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Heart className='w-5 h-5' />,
        component: InjuryTracker,
        category: 'Intelligence',
      },
      {
        id: 'streaming',
        label: 'Live Stream',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Radio className='w-5 h-5' />,
        component: StreamingHub,
        category: 'Intelligence',
      },
      // Management
      {
        id: 'bankroll',
        label: 'Bankroll',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Wallet _className='w-5 h-5' />,
        component: BankrollManager,
        category: 'Management',
      },
      {
        id: 'risk',
        label: 'Risk Engine',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Shield className='w-5 h-5' />,
        component: RiskEngine,
        badge: '23%',
        category: 'Management',
      },
      {
        id: 'sportsbooks',
        label: 'Sportsbooks',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Briefcase className='w-5 h-5' />,
        component: SportsbookManager,
        category: 'Management',
      },
      {
        id: 'automation',
        label: 'Auto-Pilot',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Cpu className='w-5 h-5' />,
        component: AutoPilot,
        badge: 'AI',
        category: 'Management',
      },
      {
        id: 'alerts',
        label: 'Alert Center',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <AlertTriangle className='w-5 h-5' />,
        component: AlertCenter,
        badge: '5',
        category: 'Management',
      },
      // Tools
      {
        id: 'backtesting',
        label: 'Backtesting',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <BarChart3 className='w-5 h-5' />,
        component: Backtesting,
        category: 'Tools',
      },
      {
        id: 'academy',
        label: 'Academy',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <GraduationCap className='w-5 h-5' />,
        component: Academy,
        category: 'Tools',
      },
      {
        id: 'community',
        label: 'Community',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <Users className='w-5 h-5' />,
        component: Community,
        category: 'Tools',
      },
      {
        id: 'analytics-dashboard',
        label: 'Analytics',
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon: <BarChart3 className='w-5 h-5' />,
        component: AnalyticsDashboard,
        badge: 'PRO',
        category: 'Tools',
      },
    ],
    []
  );

  useEffect(() => {
    const _timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const _ActiveComponent =
    navigationItems.find(item => item.id === activeView)?.component || Dashboard;

  const _categories = ['Core', 'Trading', 'AI Engine', 'Intelligence', 'Management', 'Tools'];

  if (isLoading) {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            className='w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-6'
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2'>
            A1Betting Platform
          </h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-400'>Initializing AI-powered sports intelligence...</p>
        </div>
      </motion.div>
    );
  }

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
      {/* Mobile Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='lg:hidden bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent'>
            A1Betting
          </h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='text-white hover:text-purple-400 transition-colors'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {isMobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
          </button>
        </div>
      </div>

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex'>
        {/* Sidebar */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AnimatePresence>
          {(isMobileMenuOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className='fixed lg:relative z-50 lg:z-auto w-80 h-full lg:h-screen bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 overflow-y-auto'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='p-6'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='hidden lg:block mb-8'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h1 className='text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2'>
                    A1Betting
                  </h1>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-gray-400 text-sm'>Ultimate Sports Intelligence Platform</p>
                </div>

                {/* User Profile */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-3 mb-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='w-12 h-12 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full flex items-center justify-center'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-slate-900 font-bold text-lg'>🤖</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-bold text-purple-300'>AlphaBot</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-400'>Elite Trader</div>
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between text-sm'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400'>+$18,420</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-cyan-400'>+847% ROI</span>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <nav className='space-y-6'>
                  {categories.map(category => (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div key={category}>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-500 uppercase tracking-wider mb-2'>
                        {category}
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='space-y-1'>
                        {navigationItems
                          .filter(item => item.category === category)
                          .map(item => (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveView(item.id);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                                activeView === item.id
                                  ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                                  : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                              }`}
                            >
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='flex items-center space-x-3'>
                                {item.icon}
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span className='font-medium'>{item.label}</span>
                              </div>
                              {item.badge && (
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    item.badge === 'HOT'
                                      ? 'bg-red-500/20 text-red-300'
                                      : item.badge === 'LIVE'
                                        ? 'bg-green-500/20 text-green-300'
                                        : item.badge === 'NEW'
                                          ? 'bg-blue-500/20 text-blue-300'
                                          : item.badge === 'Q'
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'bg-purple-500/20 text-purple-300'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </nav>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2 mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm text-green-400'>All Systems Operational</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400 space-y-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>✓ 47+ ML Models Active</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>✓ Real-time Data Feeds</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>✓ API Integrations Online</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex-1 min-h-screen'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='p-6 lg:p-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <React.Suspense
              fallback={
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-center h-96'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <RefreshCw className='w-8 h-8 animate-spin text-purple-400' />
                </div>
              }
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <ActiveComponent />
            </React.Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumSportsPlatform;
