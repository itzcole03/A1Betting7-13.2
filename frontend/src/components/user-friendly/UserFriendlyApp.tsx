import React, { useState, lazy, Suspense } from 'react';
import { Brain, BarChart3, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from '../core/ErrorBoundary';

// Simplified test - comment out problematic imports temporarily
// const PropOllamaUnified = lazy(() => import('../PropOllamaUnified'));
// const PredictionDisplay = lazy(() => import('../PredictionDisplay'));

// Simple test components
const PropOllamaUnified = lazy(() => Promise.resolve({ default: () => <div className="p-4 text-white">PropOllama Test</div> }));
const PredictionDisplay = lazy(() => Promise.resolve({ default: () => <div className="p-4 text-white">Predictions Test</div> }));
// const AnalyticsTab = lazy(() => import('../AnalyticsTab')); // Uncomment after validation
// const QuantumAITab = lazy(() => import('../QuantumAITab')); // Uncomment after validation

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

const navItems: NavItem[] = [
  {
    id: 'propollama',
    label: 'PropOllama',
    icon: <Brain className='w-5 h-5' />,
    component: PropOllamaUnified,
  },
  {
    id: 'predictions',
    label: 'Predictions',
    icon: <BarChart3 className='w-5 h-5' />,
    component: PredictionDisplay,
  },
  // {
  //   id: 'analytics',
  //   label: 'Analytics',
  //   icon: <BarChart3 className='w-5 h-5' />,
  //   component: AnalyticsTab,
  // },
  // {
  //   id: 'quantumai',
  //   label: 'Quantum AI',
  //   icon: <Brain className='w-5 h-5' />,
  //   component: QuantumAITab,
  // },
];

const UserFriendlyApp: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('propollama');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const ActiveComponent = navItems.find(item => item.id === activeView)?.component || PropOllamaUnified;

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
      {/* Mobile Header */}
      <div className='lg:hidden bg-black/20 backdrop-blur-lg border-b border-white/10 p-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-bold text-yellow-400'>PropGPT</h1>
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
          {(isMobileMenuOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className='fixed lg:relative z-50 lg:z-auto w-64 h-full lg:h-screen bg-black/40 backdrop-blur-lg border-r border-white/10'
            >
              <div className='p-6'>
                <div className='hidden lg:block mb-8'>
                  <h1 className='text-2xl font-bold text-yellow-400'>PropGPT</h1>
                  <p className='text-gray-400 text-sm'>AI Prop Research & Analytics</p>
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
          <ErrorBoundary>
            <Suspense fallback={<div className='text-white p-8'>Loading...</div>}>
              <ActiveComponent />
            </Suspense>
          </ErrorBoundary>
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
