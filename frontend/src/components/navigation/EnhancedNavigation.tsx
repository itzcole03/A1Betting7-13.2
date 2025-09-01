import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Brain,
  Target,
  TrendingUp,
  BarChart3,
  Calculator,
  Search,
  Bookmark,
  Settings,
  User,
  Activity,
  Zap,
  Menu,
  X,
  ChevronRight,
  Flame,
  Trophy,
  Shield,
  Clock,
  DollarSign,
  BookOpen,
  Eye,
  Star,
  Bell,
  HelpCircle,
  Database,
} from 'lucide-react';
import { signalNavReady } from '../../navigation/navReadySignal';

interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  description?: string;
  category: 'main' | 'research' | 'tools' | 'analytics';
  isNew?: boolean;
  isPremium?: boolean;
  isHot?: boolean;
}

interface EnhancedNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({
  isOpen,
  onToggle,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(3);
  // Test-friendly admin detection: read localStorage safely so E2E tests
  // that render the app without full providers can still observe admin UI.
  const isLocalAdmin = (() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const raw = window.localStorage.getItem('user');
      if (!raw) return false;
      const parsed = JSON.parse(raw) as unknown;
      const obj = parsed as Record<string, unknown> | null;
      if (!obj) return false;
      const role = obj['role'];
      if (role === 'admin') return true;
      const perms = obj['permissions'];
      if (Array.isArray(perms)) return perms.includes('admin');
      return false;
    } catch {
      return false;
    }
  })();
  
  // Signal navigation readiness on mount
  useEffect(() => {
    signalNavReady();
  }, []);

  const navigationItems: NavigationItem[] = [
    // Main Features
    {
      id: 'propfinder-clone',
      name: 'PropFinder Clone',
      href: '/propfinder-clone',
      icon: Trophy,
      badge: 'CLONE',
      description: 'Exact PropFinder interface clone',
      category: 'main',
      isNew: true,
    },
    {
      id: 'prop-killer',
      name: 'PropFinder Killer',
      href: '/prop-killer',
      icon: Brain,
      badge: 'HOT',
      description: 'AI-powered prop research that beats PropFinder',
      category: 'main',
      isHot: true,
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Your personalized betting command center',
      category: 'main',
    },
    {
      id: 'money-maker',
      name: 'Money Maker',
      href: '/money-maker',
      icon: DollarSign,
      badge: 'NEW',
      description: 'Quantum AI betting engine',
      category: 'main',
      isNew: true,
    },

    // Research Tools
    {
      id: 'player-research',
      name: 'Player Research',
      href: '/player',
      icon: Search,
      description: 'Deep player analytics and projections',
      category: 'research',
    },
    {
      id: 'prop-scanner',
      name: 'Prop Scanner',
      href: '/prop-scanner',
      icon: Eye,
      badge: 'BETA',
      description: 'Real-time prop opportunity scanning',
      category: 'research',
      isNew: true,
    },
    {
      id: 'matchup-analyzer',
      name: 'Matchup Analyzer',
      href: '/matchup-analyzer',
      icon: Target,
      description: 'Advanced matchup breakdowns',
      category: 'research',
    },
    {
      id: 'injury-tracker',
      name: 'Injury Tracker',
      href: '/injury-tracker',
      icon: Shield,
      badge: 2,
      description: 'Live injury reports and impact analysis',
      category: 'research',
    },

    // Tools
    {
      id: 'arbitrage',
      name: 'Arbitrage Hunter',
      href: '/arbitrage',
      icon: Target,
      badge: 'HOT',
      description: 'Multi-sportsbook arbitrage opportunities',
      category: 'tools',
      isHot: true,
    },
    {
      id: 'advanced-arbitrage',
      name: 'Advanced Arbitrage',
      href: '/advanced-arbitrage',
      icon: Zap,
      badge: 'Phase 4.2',
      description: 'Sophisticated arbitrage detection across 15+ sportsbooks',
      category: 'tools',
      isNew: true,
    },
    {
      id: 'kelly-calculator',
      name: 'Kelly Calculator',
      href: '/kelly-calculator',
      icon: Calculator,
      description: 'Optimal bet sizing with Kelly Criterion',
      category: 'tools',
    },
    {
      id: 'advanced-kelly',
      name: 'Advanced Kelly',
      href: '/advanced-kelly',
      icon: BarChart3,
      badge: 'Phase 4.3',
      description: 'Sophisticated Kelly Criterion with risk management & portfolio optimization',
      category: 'tools',
      isNew: true,
    },
    {
      id: 'odds-comparison',
      name: 'Odds Comparison',
      href: '/odds-comparison',
      icon: TrendingUp,
      description: 'Real-time odds across all sportsbooks',
      category: 'tools',
    },
    {
      id: 'line-tracker',
      name: 'Line Tracker',
      href: '/line-tracker',
      icon: Activity,
      description: 'Track line movements and betting patterns',
      category: 'tools',
    },
    {
      id: 'cheatsheets',
      name: 'Prop Cheatsheets',
      href: '/cheatsheets',
      icon: BookOpen,
      description: 'Quick reference guides and strategies',
      category: 'tools',
    },
    {
      id: 'smart-alerts',
      name: 'Smart Alerts',
      href: '/smart-alerts',
      icon: Bell,
      badge: 'NEW',
      description: 'AI-powered alert system for betting opportunities',
      category: 'tools',
      isNew: true,
    },

    // Analytics
    {
      id: 'bet-tracking',
      name: 'Bet Tracking',
      href: '/tracking',
      icon: BarChart3,
      description: 'Track your betting performance',
      category: 'analytics',
    },
    {
      id: 'ml-models',
      name: 'AI/ML Models',
      href: '/ml-models',
      icon: Brain,
      badge: 'PRO',
      description: 'Advanced machine learning models',
      category: 'analytics',
      isPremium: true,
    },
    {
      id: 'performance',
      name: 'Performance',
      href: '/performance',
      icon: Trophy,
      description: 'Detailed performance analytics',
      category: 'analytics',
    },
    {
      id: 'data-ecosystem',
      name: 'Data Ecosystem',
      href: '/data-ecosystem',
      icon: Database,
      badge: 'NEW',
      description: 'Monitor data infrastructure and quality',
      category: 'analytics',
      isNew: true,
    },
    {
      id: 'ai-dashboard',
      name: 'Advanced AI Dashboard',
      href: '/ai-dashboard',
      icon: Brain,
      badge: 'Phase 3',
      description: 'Multi-sport AI enhancement platform with real-time inference',
      category: 'analytics',
      isNew: true,
      isHot: true,
    },
    {
      id: 'live-betting',
      name: 'Live Betting Engine',
      href: '/live-betting',
      icon: Zap,
      badge: 'Phase 4',
      description: 'Real-time odds tracking and opportunities across 15+ sportsbooks',
      category: 'main',
      isNew: true,
      isHot: true,
    },
    {
      id: 'propfinder-comparison',
      name: 'vs PropFinder',
      href: '/comparison',
      icon: Star,
      badge: 'NEW',
      description: '4x faster, free forever comparison',
      category: 'main',
      isNew: true,
    },
    {
      id: 'advanced-player-dashboard',
      name: 'Advanced Player Dashboard',
      href: '/advanced-player',
      icon: User,
      badge: 'HOT',
      description: 'Enhanced dashboard with customizable trend ranges',
      category: 'research',
      isHot: true,
    },
    {
      id: 'real-time-lookup',
      name: 'Player Lookup',
      href: '/player-lookup',
      icon: Search,
      badge: 'NEW',
      description: 'Sub-second player search with comprehensive data',
      category: 'research',
      isNew: true,
    },
    {
      id: 'matchup-analysis',
      name: 'Matchup Analysis',
      href: '/matchup-analysis',
      icon: Target,
      badge: 'PRO',
      description: 'Head-to-head player vs player comparisons',
      category: 'analytics',
      isPremium: true,
    },
  ];

  const categories = [
    { id: 'main', name: 'Main', icon: Home },
    { id: 'research', name: 'Research', icon: Search },
    { id: 'tools', name: 'Tools', icon: Calculator },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  ];

  const filteredItems = navigationItems.filter(item => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isCurrentPath = (href: string) => {
    if (href === '/' && location.pathname === '/') return true;
    if (href !== '/' && location.pathname.startsWith(href)) return true;
    return false;
  };

  const getBadgeColor = (badge: string | number | undefined, item: NavigationItem) => {
    if (typeof badge === 'number') return 'bg-red-500 text-white';
    if (item.isHot) return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
    if (item.isNew) return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    if (item.isPremium) return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white';
    
    switch (badge) {
      case 'HOT': return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
      case 'NEW': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'BETA': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'PRO': return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <>
      {/* Mobile/Desktop Toggle Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // eslint-disable-next-line no-console
          console.log('Navigation toggle clicked, isOpen:', isOpen);
          onToggle();
        }}
        className="fixed top-4 left-4 z-[9999] bg-slate-800/90 backdrop-blur-sm p-3 rounded-xl text-white hover:bg-slate-700 transition-all duration-200 shadow-lg border border-slate-600 hover:shadow-xl pointer-events-auto cursor-pointer"
        title={isOpen ? 'Close Navigation' : 'Open Navigation'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Quick Links (visible) - helpful for tests and keyboard navigation */}
      <div className="fixed top-4 left-20 z-[9999] hidden md:flex items-center space-x-3">
        <Link to="/ml-models" className="text-sm text-gray-300 hover:text-white" aria-label="AI/ML Models Link">
          AI/ML Models
        </Link>
        <Link to="/betting" className="text-sm text-gray-300 hover:text-white" aria-label="Betting Interface Link">
          Betting Interface
        </Link>
        <Link to="/arbitrage" className="text-sm text-gray-300 hover:text-white" aria-label="Arbitrage Link">
          Arbitrage
        </Link>
        {isLocalAdmin && (
          <a
            href="/admin"
            role="button"
            aria-label="Admin"
            className="text-sm ml-2 inline-flex items-center px-3 py-1 rounded bg-slate-700 text-white text-xs hover:bg-slate-600 transition-colors"
          >
            Admin
          </a>
        )}
        {isLocalAdmin && (
          <button
            type="button"
            aria-label="Switch to User"
            className="text-sm ml-2 inline-flex items-center px-3 py-1 rounded bg-slate-700 text-white text-xs hover:bg-slate-600 transition-colors"
            onClick={() => {
              try {
                const raw = window.localStorage.getItem('user');
                const parsed = raw ? JSON.parse(raw) : {};
                const newUser = { ...(parsed || {}), role: 'user', permissions: [] };
                window.localStorage.setItem('user', JSON.stringify(newUser));
              } catch {
                // ignore
              }
              try {
                navigate('/betting');
              } catch {
                window.location.href = '/betting';
              }
            }}
          >
            Switch to User
          </button>
        )}
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />
        )}
      </AnimatePresence>

      {/* Navigation Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-lg border-r border-slate-700 shadow-2xl z-[9998] flex flex-col"
            role="navigation"
            data-testid="primary-nav"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">A1 Betting</h1>
                    <p className="text-xs text-gray-400">PropFinder Killer</p>
                  </div>
                </div>
                
                {/* Notifications */}
                <div className="relative">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="px-6 py-4 border-b border-slate-700">
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                        isActive
                          ? 'bg-cyan-500 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    const isCurrent = isCurrentPath(item.href);
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.href}
                          onClick={onClose}
                          className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                            isCurrent
                              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                              : 'text-gray-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg transition-all ${
                              isCurrent 
                                ? 'bg-white/20' 
                                : 'bg-slate-800 group-hover:bg-slate-700'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.name}</div>
                              {item.description && (
                                <div className={`text-xs ${
                                  isCurrent ? 'text-white/70' : 'text-gray-400'
                                }`}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {item.badge && (
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${getBadgeColor(item.badge, item)}`}>
                                {item.badge}
                              </span>
                            )}
                            {!isCurrent && (
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {/* Empty State */}
              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">No features found</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Pro User</div>
                    <div className="text-xs text-gray-400">Premium Access</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  {isLocalAdmin && (
                    <a
                      href="/admin"
                      role="button"
                      aria-label="Admin"
                      className="ml-2 inline-flex items-center px-3 py-1 rounded bg-slate-700 text-white text-xs hover:bg-slate-600 transition-colors"
                    >
                      Admin
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors">
                  <HelpCircle className="w-3 h-3" />
                  <span>Help</span>
                </button>
                <div className="flex items-center space-x-1 text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedNavigation;
