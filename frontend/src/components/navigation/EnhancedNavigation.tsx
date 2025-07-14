import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BarChart3,
  Target,
  DollarSign,
  TrendingUp,
  Activity,
  Settings,
  User,
  Users,
  Shield,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
  Database,
  Globe,
  Crown,
  Star,
  Award,
  Gamepad2,
  LineChart,
  PieChart,
  Brain,
  Eye,
  Lock,
  CreditCard,
  Smartphone,
  Laptop,
  HelpCircle,
  LogOut,
  Plus,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: string;
  submenu?: NavigationItem[];
  adminOnly?: boolean;
  proOnly?: boolean;
}

interface UserRole {
  isAdmin: boolean;
  isPro: boolean;
  isElite: boolean;
}

interface EnhancedNavigationProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  userRole?: UserRole;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({
  currentPath = '/',
  onNavigate,
  userRole = { isAdmin: false, isPro: false, isElite: false },
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      submenu: [
        { id: 'overview', label: 'Overview', icon: BarChart3, path: '/dashboard/overview' },
        { id: 'analytics', label: 'Analytics', icon: LineChart, path: '/dashboard/analytics' },
        { id: 'portfolio', label: 'Portfolio', icon: PieChart, path: '/dashboard/portfolio' },
        {
          id: 'performance',
          label: 'Performance',
          icon: TrendingUp,
          path: '/dashboard/performance',
        },
      ],
    },
    {
      id: 'betting',
      label: 'Betting',
      icon: Target,
      path: '/betting',
      submenu: [
        { id: 'opportunities', label: 'Opportunities', icon: Eye, path: '/betting/opportunities' },
        { id: 'arbitrage', label: 'Arbitrage Scanner', icon: Zap, path: '/betting/arbitrage' },
        { id: 'live', label: 'Live Betting', icon: Activity, path: '/betting/live' },
        { id: 'history', label: 'Bet History', icon: Award, path: '/betting/history' },
      ],
    },
    {
      id: 'predictions',
      label: 'Predictions',
      icon: Brain,
      path: '/predictions',
      badge: 'AI',
      submenu: [
        { id: 'ml-models', label: 'ML Models', icon: Brain, path: '/predictions/models' },
        { id: 'props', label: 'Player Props', icon: Gamepad2, path: '/predictions/props' },
        {
          id: 'quantum',
          label: 'Quantum AI',
          icon: Zap,
          path: '/predictions/quantum',
          proOnly: true,
        },
        {
          id: 'shap',
          label: 'SHAP Analysis',
          icon: BarChart3,
          path: '/predictions/shap',
          proOnly: true,
        },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: Database,
      path: '/tools',
      submenu: [
        { id: 'bankroll', label: 'Bankroll Manager', icon: DollarSign, path: '/tools/bankroll' },
        { id: 'risk', label: 'Risk Manager', icon: Shield, path: '/tools/risk' },
        { id: 'lineup', label: 'Lineup Builder', icon: Users, path: '/tools/lineup' },
        {
          id: 'moneymaker',
          label: 'Ultimate Money Maker',
          icon: Crown,
          path: '/tools/moneymaker',
          proOnly: true,
        },
      ],
    },
    {
      id: 'data',
      label: 'Data',
      icon: Globe,
      path: '/data',
      submenu: [
        { id: 'odds', label: 'Live Odds', icon: Activity, path: '/data/odds' },
        { id: 'injuries', label: 'Injury Reports', icon: Star, path: '/data/injuries' },
        { id: 'weather', label: 'Weather Station', icon: Globe, path: '/data/weather' },
        {
          id: 'social',
          label: 'Social Intelligence',
          icon: Users,
          path: '/data/social',
          proOnly: true,
        },
      ],
    },
    {
      id: 'account',
      label: 'Account',
      icon: User,
      path: '/account',
      submenu: [
        { id: 'profile', label: 'Profile', icon: User, path: '/account/profile' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/account/settings' },
        { id: 'billing', label: 'Billing', icon: CreditCard, path: '/account/billing' },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          path: '/account/notifications',
          badge: notifications > 0 ? notifications.toString() : undefined,
        },
      ],
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      path: '/admin',
      adminOnly: true,
      submenu: [
        { id: 'panel', label: 'Admin Panel', icon: Settings, path: '/admin/panel' },
        { id: 'users', label: 'User Management', icon: Users, path: '/admin/users' },
        { id: 'system', label: 'System Health', icon: Activity, path: '/admin/system' },
        { id: 'advanced', label: 'Advanced Settings', icon: Database, path: '/admin/advanced' },
      ],
    },
  ];

  const filteredItems = navigationItems.filter(item => {
    if (item.adminOnly && !userRole.isAdmin) return false;
    if (item.proOnly && !userRole.isPro && !userRole.isElite) return false;
    return true;
  });

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const isCurrentPath = (path: string) => {
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const searchableItems = filteredItems.flatMap(item => [
    item,
    ...(item.submenu?.filter(subItem => {
      if (subItem.adminOnly && !userRole.isAdmin) return false;
      if (subItem.proOnly && !userRole.isPro && !userRole.isElite) return false;
      return true;
    }) || []),
  ]);

  const filteredSearchResults = searchableItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NavigationItem: React.FC<{
    item: NavigationItem;
    level?: number;
    isExpanded?: boolean;
  }> = ({ item, level = 0, isExpanded = false }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isActive = isCurrentPath(item.path);
    const canExpand = hasSubmenu && !isCollapsed;

    return (
      <div className={`${level > 0 ? 'ml-4' : ''}`}>
        <button
          onClick={() => {
            if (hasSubmenu && !isCollapsed) {
              toggleMenu(item.id);
            } else {
              handleNavigate(item.path);
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${
            isActive
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
              : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <div className='flex items-center space-x-3'>
            <item.icon
              className={`w-5 h-5 ${
                isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'
              }`}
            />
            {!isCollapsed && (
              <>
                <span className='font-medium'>{item.label}</span>
                {item.badge && (
                  <span className='px-2 py-1 text-xs bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full'>
                    {item.badge}
                  </span>
                )}
                {item.proOnly && <Crown className='w-3 h-3 text-yellow-400' />}
                {item.adminOnly && <Shield className='w-3 h-3 text-red-400' />}
              </>
            )}
          </div>
          {canExpand && (
            <ChevronRight
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
        </button>

        {/* Submenu */}
        {hasSubmenu && !isCollapsed && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className='overflow-hidden'
              >
                <div className='pl-4 pt-2 space-y-1'>
                  {item.submenu.map(subItem => {
                    if (subItem.adminOnly && !userRole.isAdmin) return null;
                    if (subItem.proOnly && !userRole.isPro && !userRole.isElite) return null;

                    return <NavigationItem key={subItem.id} item={subItem} level={level + 1} />;
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-slate-900/50 backdrop-blur-lg border-r border-slate-700/50 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className='p-4 border-b border-slate-700/50'>
        <div className='flex items-center justify-between'>
          {!isCollapsed && (
            <div>
              <h2 className='text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent'>
                A1 Betting
              </h2>
              <p className='text-xs text-gray-400'>Platform Navigation</p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className='p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors'
          >
            {isCollapsed ? <ChevronRight className='w-4 h-4' /> : <Menu className='w-4 h-4' />}
          </button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className='mt-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Search navigation...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                className='w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm'
              />
            </div>

            {/* Search Results */}
            <AnimatePresence>
              {showSearch && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='absolute top-full left-4 right-4 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto'
                >
                  {filteredSearchResults.length > 0 ? (
                    <div className='p-2'>
                      {filteredSearchResults.slice(0, 8).map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleNavigate(item.path);
                            setSearchQuery('');
                            setShowSearch(false);
                          }}
                          className='w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors'
                        >
                          <item.icon className='w-4 h-4' />
                          <span className='text-sm'>{item.label}</span>
                          {item.proOnly && <Crown className='w-3 h-3 text-yellow-400' />}
                          {item.adminOnly && <Shield className='w-3 h-3 text-red-400' />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className='p-4 text-center text-gray-400 text-sm'>No results found</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className='p-4 space-y-2 overflow-y-auto flex-1'>
        {filteredItems.map(item => (
          <NavigationItem key={item.id} item={item} isExpanded={expandedMenus.includes(item.id)} />
        ))}
      </div>

      {/* Footer */}
      <div className='p-4 border-t border-slate-700/50'>
        {!isCollapsed && (
          <div className='space-y-2'>
            {/* User Role Badge */}
            <div className='flex items-center justify-center'>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  userRole.isElite
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : userRole.isPro
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}
              >
                {userRole.isElite ? 'ELITE' : userRole.isPro ? 'PRO' : 'FREE'}
                {userRole.isAdmin && ' • ADMIN'}
              </span>
            </div>

            {/* Quick Actions */}
            <div className='flex space-x-2'>
              <button
                onClick={() => handleNavigate('/help')}
                className='flex-1 flex items-center justify-center space-x-1 px-2 py-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors'
              >
                <HelpCircle className='w-4 h-4' />
                <span className='text-xs'>Help</span>
              </button>
              <button
                onClick={() => handleNavigate('/logout')}
                className='flex-1 flex items-center justify-center space-x-1 px-2 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
              >
                <LogOut className='w-4 h-4' />
                <span className='text-xs'>Logout</span>
              </button>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className='space-y-2'>
            <button
              onClick={() => handleNavigate('/help')}
              className='w-full p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors'
            >
              <HelpCircle className='w-5 h-5 mx-auto' />
            </button>
            <button
              onClick={() => handleNavigate('/logout')}
              className='w-full p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
            >
              <LogOut className='w-5 h-5 mx-auto' />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Toggle (for responsive design) */}
      <div className='md:hidden fixed bottom-4 right-4'>
        <button
          onClick={onToggleCollapse}
          className='bg-gradient-to-r from-cyan-500 to-purple-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all'
        >
          {isCollapsed ? <Menu className='w-6 h-6' /> : <X className='w-6 h-6' />}
        </button>
      </div>
    </div>
  );
};

export default EnhancedNavigation;
