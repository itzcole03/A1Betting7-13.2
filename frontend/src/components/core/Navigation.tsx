import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Brain,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  Cpu,
  DollarSign,
  GraduationCap,
  Heart,
  Home,
  LineChart,
  MessageSquare,
  Radio,
  Shield,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  description?: string;
}

export interface NavigationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: NavigationItem[];
  isCollapsed?: boolean;
}

interface NavigationProps {
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  activeView?: string;
  onNavigate?: (viewId: string) => void;
}

const navigationSections: NavigationSection[] = [
  {
    id: 'core',
    title: 'Core',
    icon: <Home className='w-4 h-4' />,
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <Home className='w-4 h-4' />,
        description: 'Platform overview & key metrics',
      },
    ],
  },
  {
    id: 'trading',
    title: 'Trading',
    icon: <DollarSign className='w-4 h-4' />,
    items: [
      {
        id: 'moneymaker',
        label: 'Money Maker',
        icon: <DollarSign className='w-4 h-4' />,
        badge: 'HOT',
        description: 'AI-powered betting recommendations',
      },
      {
        id: 'arbitrage',
        label: 'Arbitrage Scanner',
        icon: <Zap className='w-4 h-4' />,
        badge: 'LIVE',
        description: 'Real-time arbitrage opportunities',
      },
      {
        id: 'livebetting',
        label: 'Live Betting',
        icon: <Radio className='w-4 h-4' />,
        description: 'Live betting opportunities',
      },
      {
        id: 'prizepicks',
        label: 'PrizePicks Pro',
        icon: <Target className='w-4 h-4' />,
        badge: '87%',
        description: 'Daily fantasy optimization',
      },
      {
        id: 'lineup',
        label: 'Lineup Builder',
        icon: <Activity className='w-4 h-4' />,
        description: 'Smart lineup optimization',
      },
    ],
  },
  {
    id: 'ai-engine',
    title: 'AI Engine',
    icon: <Brain className='w-4 h-4' />,
    items: [
      {
        id: 'analytics',
        label: 'ML Analytics',
        icon: <Brain className='w-4 h-4' />,
        badge: '47',
        description: '47+ machine learning models',
      },
      {
        id: 'predictions',
        label: 'AI Predictions',
        icon: <LineChart className='w-4 h-4' />,
        description: 'Advanced prediction algorithms',
      },
      {
        id: 'quantum',
        label: 'Quantum AI',
        icon: <Cpu className='w-4 h-4' />,
        badge: 'Q',
        description: 'Quantum-enhanced neural networks',
      },
      {
        id: 'shap',
        label: 'SHAP Analysis',
        icon: <BarChart3 className='w-4 h-4' />,
        description: 'Model explainability & insights',
      },
      {
        id: 'historical',
        label: 'Historical Data',
        icon: <Clock className='w-4 h-4' />,
        description: 'Advanced historical analysis',
      },
    ],
  },
  {
    id: 'intelligence',
    title: 'Intelligence',
    icon: <MessageSquare className='w-4 h-4' />,
    items: [
      {
        id: 'social',
        label: 'Social Intel',
        icon: <MessageSquare className='w-4 h-4' />,
        description: 'Social sentiment analysis',
      },
      {
        id: 'news',
        label: 'News Hub',
        icon: <Award className='w-4 h-4' />,
        badge: 'NEW',
        description: 'Real-time sports news',
      },
      {
        id: 'weather',
        label: 'Weather Station',
        icon: <Cloud className='w-4 h-4' />,
        description: 'Weather impact analysis',
      },
      {
        id: 'injuries',
        label: 'Injury Tracker',
        icon: <Heart className='w-4 h-4' />,
        description: 'Player injury monitoring',
      },
      {
        id: 'streaming',
        label: 'Live Stream',
        icon: <Radio className='w-4 h-4' />,
        description: 'HD streams & real-time data',
      },
      {
        id: 'propollama',
        label: 'PropOllama AI',
        icon: <Brain className='w-4 h-4' />,
        badge: 'AI',
        description: 'AI-powered betting assistant',
      },
    ],
  },
  {
    id: 'management',
    title: 'Management',
    icon: <Briefcase className='w-4 h-4' />,
    items: [
      {
        id: 'bankroll',
        label: 'Bankroll Manager',
        icon: <Wallet className='w-4 h-4' />,
        description: 'Portfolio & risk management',
      },
      {
        id: 'risk',
        label: 'Risk Engine',
        icon: <Shield className='w-4 h-4' />,
        badge: '23%',
        description: 'Advanced risk assessment',
      },
      {
        id: 'sportsbooks',
        label: 'Sportsbooks',
        icon: <Briefcase className='w-4 h-4' />,
        description: 'Account management',
      },
      {
        id: 'automation',
        label: 'Auto-Pilot',
        icon: <Cpu className='w-4 h-4' />,
        badge: 'AI',
        description: 'Betting automation & rules',
      },
      {
        id: 'alerts',
        label: 'Alert Center',
        icon: <AlertTriangle className='w-4 h-4' />,
        badge: '5',
        description: 'Advanced alert management',
      },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    icon: <BarChart3 className='w-4 h-4' />,
    items: [
      {
        id: 'backtesting',
        label: 'Backtesting',
        icon: <BarChart3 className='w-4 h-4' />,
        description: 'Strategy testing & validation',
      },
      {
        id: 'education',
        label: 'Academy',
        icon: <GraduationCap className='w-4 h-4' />,
        description: 'Education & training center',
      },
      {
        id: 'community',
        label: 'Community Hub',
        icon: <Users className='w-4 h-4' />,
        description: 'Social trading & leaderboards',
      },
    ],
  },
];

export const Navigation: React.FC<NavigationProps> = ({
  isMobileMenuOpen,
  onCloseMobileMenu,
  activeView = 'dashboard',
  onNavigate,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  const handleItemClick = (itemId: string) => {
    onNavigate?.(itemId);
    onCloseMobileMenu();
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'HOT':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'LIVE':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'NEW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Q':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'AI':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <AnimatePresence>
      {(isMobileMenuOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
        <motion.aside
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          exit={{ x: -320 }}
          className={cn(
            'fixed lg:relative z-50 lg:z-auto w-80 h-full lg:h-screen',
            'bg-slate-900/90 lg:bg-slate-900/80 backdrop-blur-xl',
            'border-r border-slate-700/50 overflow-y-auto',
            'lg:flex-shrink-0'
          )}
        >
          <div className='p-6'>
            {/* Desktop Logo Area */}
            <div className='hidden lg:block mb-8'>
              <div className='flex items-center space-x-3 mb-4'>
                <div className='w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center'>
                  <TrendingUp className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h2 className='text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent'>
                    A1Betting
                  </h2>
                  <p className='text-xs text-gray-400'>Ultimate Sports Intelligence</p>
                </div>
              </div>
            </div>

            {/* User Profile Card */}
            <div className='mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm'>
              <div className='flex items-center space-x-3 mb-3'>
                <div className='w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center'>
                  <span className='text-slate-900 font-bold text-lg'>🤖</span>
                </div>
                <div>
                  <div className='font-bold text-cyan-300'>AlphaBot</div>
                  <div className='text-xs text-gray-400'>Elite Trader</div>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div className='text-center'>
                  <div className='text-green-400 font-bold'>+$18,420</div>
                  <div className='text-xs text-gray-400'>Profit</div>
                </div>
                <div className='text-center'>
                  <div className='text-cyan-400 font-bold'>+847%</div>
                  <div className='text-xs text-gray-400'>ROI</div>
                </div>
              </div>
            </div>

            {/* Navigation Sections */}
            <nav className='space-y-2'>
              {navigationSections.map(section => {
                const isCollapsed = collapsedSections.has(section.id);

                return (
                  <div key={section.id} className='space-y-1'>
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className='w-full flex items-center justify-between p-2 text-xs text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors'
                    >
                      <div className='flex items-center space-x-2'>
                        {section.icon}
                        <span>{section.title}</span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className='w-3 h-3' />
                      ) : (
                        <ChevronDown className='w-3 h-3' />
                      )}
                    </button>

                    {/* Section Items */}
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className='space-y-1 overflow-hidden'
                        >
                          {section.items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleItemClick(item.id)}
                              className={cn(
                                'w-full flex items-center justify-between p-3 rounded-lg transition-all group',
                                activeView === item.id
                                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300'
                                  : 'text-gray-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                              )}
                            >
                              <div className='flex items-center space-x-3'>
                                {item.icon}
                                <div className='text-left'>
                                  <div className='font-medium text-sm'>{item.label}</div>
                                  {item.description && (
                                    <div className='text-xs text-gray-500 group-hover:text-gray-400'>
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {item.badge && (
                                <span
                                  className={cn(
                                    'text-xs px-2 py-1 rounded-full border font-medium',
                                    getBadgeColor(item.badge)
                                  )}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* System Status */}
            <div className='mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm'>
              <div className='flex items-center space-x-2 mb-3'>
                <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
                <span className='text-sm font-medium text-green-400'>All Systems Operational</span>
              </div>
              <div className='space-y-1 text-xs text-gray-400'>
                <div className='flex justify-between'>
                  <span>✓ ML Models Active</span>
                  <span className='text-cyan-400'>47+</span>
                </div>
                <div className='flex justify-between'>
                  <span>✓ Data Feeds</span>
                  <span className='text-green-400'>Live</span>
                </div>
                <div className='flex justify-between'>
                  <span>✓ API Status</span>
                  <span className='text-green-400'>Online</span>
                </div>
                <div className='flex justify-between'>
                  <span>✓ Win Rate</span>
                  <span className='text-purple-400'>73.8%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Navigation;
