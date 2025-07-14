import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Brain,
  DollarSign,
  Home,
  Menu,
  Settings as SettingsIcon,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import React, { useState } from 'react';

// Simple dashboard component
const SimpleDashboard: React.FC = () => {
  const [stats] = useState({
    balance: 1250.0,
    todayProfit: 125.5,
    winRate: 78.5,
    activeBets: 3,
  });

  return (
    <div className='p-6 space-y-6'>
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2'>
          A1 Betting Platform
        </h1>
        <p className='text-gray-400'>AI-Powered Sports Betting Intelligence</p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <motion.div
          className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6'
          whileHover={{ scale: 1.02 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Account Balance</p>
              <p className='text-2xl font-bold text-white'>${stats.balance.toFixed(2)}</p>
            </div>
            <DollarSign className='w-8 h-8 text-yellow-400' />
          </div>
        </motion.div>

        <motion.div
          className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6'
          whileHover={{ scale: 1.02 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Today's Profit</p>
              <p className='text-2xl font-bold text-green-400'>+${stats.todayProfit.toFixed(2)}</p>
            </div>
            <TrendingUp className='w-8 h-8 text-green-400' />
          </div>
        </motion.div>

        <motion.div
          className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6'
          whileHover={{ scale: 1.02 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Win Rate</p>
              <p className='text-2xl font-bold text-blue-400'>{stats.winRate}%</p>
            </div>
            <Target className='w-8 h-8 text-blue-400' />
          </div>
        </motion.div>

        <motion.div
          className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6'
          whileHover={{ scale: 1.02 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Active Bets</p>
              <p className='text-2xl font-bold text-purple-400'>{stats.activeBets}</p>
            </div>
            <Activity className='w-8 h-8 text-purple-400' />
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6'>
        <h3 className='text-xl font-semibold text-white mb-4'>Quick Actions</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <motion.button
            className='bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold py-3 px-6 rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className='w-5 h-5 inline mr-2' />
            AI Predictions
          </motion.button>

          <motion.button
            className='bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-400 hover:to-green-500 transition-all'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <DollarSign className='w-5 h-5 inline mr-2' />
            Place Bet
          </motion.button>

          <motion.button
            className='bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart3 className='w-5 h-5 inline mr-2' />
            // Analytics
          </motion.button>
        </div>
      </div>

      {/* Live Games Preview */}
      <div className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6'>
        <h3 className='text-xl font-semibold text-white mb-4'>Live Games</h3>
        <div className='space-y-3'>
          {[
            {
              teams: 'Lakers vs Warriors',
              odds: '2.15',
              prediction: 'Lakers +5.5',
              confidence: 85,
            },
            { teams: 'Cowboys vs Giants', odds: '1.85', prediction: 'Over 45.5', confidence: 78 },
            { teams: 'Celtics vs Heat', odds: '2.05', prediction: 'Heat ML', confidence: 82 },
          ].map((game, index) => (
            <div
              key={game.teams + '-' + index}
              className='flex items-center justify-between p-3 bg-white/5 rounded-lg'
            >
              <div>
                <p className='text-white font-medium'>{game.teams}</p>
                <p className='text-gray-400 text-sm'>AI Prediction: {game.prediction}</p>
              </div>
              <div className='text-right'>
                <p className='text-yellow-400 font-semibold'>{game.odds}</p>
                <p className='text-green-400 text-sm'>{game.confidence}% confidence</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple betting interface
const SimpleBetting: React.FC = () => {
  return (
    <div className='p-6'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-bold text-white mb-2'>Place Your Bets</h2>
        <p className='text-gray-400'>AI-powered betting recommendations</p>
      </div>

      <div className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6'>
        <p className='text-white text-center'>Betting interface coming soon...</p>
        <p className='text-gray-400 text-center mt-2'>
          Advanced betting features will be available here
        </p>
      </div>
    </div>
  );
};

// Simple profile component
const SimpleProfile: React.FC = () => {
  return (
    <div className='p-6'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-bold text-white mb-2'>Your Profile</h2>
        <p className='text-gray-400'>Manage your account and preferences</p>
      </div>

      <div className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6'>
        <p className='text-white text-center'>Profile management coming soon...</p>
        <p className='text-gray-400 text-center mt-2'>
          User settings and account management will be available here
        </p>
      </div>
    </div>
  );
};

// Simple settings component
const SimpleSettings: React.FC = () => {
  return (
    <div className='p-6'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-bold text-white mb-2'>Settings</h2>
        <p className='text-gray-400'>Configure your preferences</p>
      </div>

      <div className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6'>
        <p className='text-white text-center'>Settings panel coming soon...</p>
        <p className='text-gray-400 text-center mt-2'>
          Application settings and preferences will be available here
        </p>
      </div>
    </div>
  );
};

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

const UserFriendlyApp: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className='w-5 h-5' />,
      component: SimpleDashboard,
    },
    {
      id: 'betting',
      label: 'Betting',
      icon: <DollarSign className='w-5 h-5' />,
      component: SimpleBetting,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className='w-5 h-5' />,
      component: SimpleDashboard, // Use SimpleDashboard as placeholder
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className='w-5 h-5' />,
      component: SimpleProfile,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon className='w-5 h-5' />,
      component: SimpleSettings,
    },
  ];

  const ActiveComponent =
    navItems.find(item => item.id === activeView)?.component || SimpleDashboard;

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
      {/* Mobile Header */}
      <div className='lg:hidden bg-black/20 backdrop-blur-lg border-b border-white/10 p-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-bold text-yellow-400'>A1 Betting</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='text-white hover:text-yellow-400 transition-colors'
          >
            {isMobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
          </button>
        </div>
      </div>

      <div className='flex'>
        {/* Sidebar */}
        <AnimatePresence>
          {(isMobileMenuOpen || window.innerWidth >= 1024) && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className='fixed lg:relative z-50 lg:z-auto w-64 h-full lg:h-screen bg-black/40 backdrop-blur-lg border-r border-white/10'
            >
              <div className='p-6'>
                <div className='hidden lg:block mb-8'>
                  <h1 className='text-2xl font-bold text-yellow-400'>A1 Betting</h1>
                  <p className='text-gray-400 text-sm'>AI Sports Intelligence</p>
                </div>

                <nav className='space-y-2'>
                  {navItems.map(item => (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeView === item.id
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </motion.button>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className='flex-1 lg:ml-0'>
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
    </div>
  );
};

export default UserFriendlyApp;
