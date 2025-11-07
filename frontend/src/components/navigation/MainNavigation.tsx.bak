/**
 * MainNavigation - Updated navigation with all PropFinder-competing features
 * Includes AI Analytics, Odds Comparison, Cheatsheets, and Risk Management
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Brain, 
  TrendingUp, 
  Target, 
  Calculator,
  BookOpen,
  DollarSign,
  User,
  Settings,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  description: string;
  badge?: string;
  isNew?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/',
    description: 'Overview and analytics'
  },
  {
    id: 'player-research',
    label: 'Player Research',
    icon: User,
    path: '/player-research',
    description: 'Detailed player analysis'
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    icon: Brain,
    path: '/ai-insights',
    description: 'Ollama-powered explanations',
    badge: 'AI',
    isNew: true
  },
  {
    id: 'odds-comparison',
    label: 'Odds Comparison',
    icon: BarChart3,
    path: '/odds-comparison',
    description: 'Real-time sportsbook comparison',
    isNew: true
  },
  {
    id: 'arbitrage',
    label: 'Arbitrage',
    icon: Target,
    path: '/arbitrage',
    description: 'Guaranteed profit opportunities',
    badge: 'HOT',
    isNew: true
  },
  {
    id: 'cheatsheets',
    label: 'Cheatsheets',
    icon: BookOpen,
    path: '/cheatsheets',
    description: 'Ranked prop opportunities',
    isNew: true
  },
  {
    id: 'kelly-calculator',
    label: 'Kelly Calculator',
    icon: Calculator,
    path: '/kelly-calculator',
    description: 'Optimal bet sizing',
    isNew: true
  },
  {
    id: 'ml-models',
    label: 'ML Models',
    icon: Activity,
    path: '/ml-models',
    description: 'Model management center'
  },
  {
    id: 'betting-interface',
    label: 'Betting',
    icon: DollarSign,
    path: '/betting',
    description: 'Unified betting interface'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    description: 'App preferences'
  }
];

interface MainNavigationProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({ 
  collapsed = false, 
  onToggle 
}) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`bg-slate-900 border-r border-slate-700 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">A1Betting</h1>
              <p className="text-xs text-slate-400">PropFinder Competitor</p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      {!collapsed && (
        <div className="p-4 border-b border-slate-700">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white">All Systems Operational</span>
            </div>
            <div className="text-xs text-slate-400">
              AI • Odds • ML Models • Risk Tools
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${
                  active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`} />
                
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                            item.badge === 'AI' ? 'bg-purple-600 text-white' :
                            item.badge === 'HOT' ? 'bg-red-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.isNew && (
                          <span className="w-2 h-2 bg-green-400 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 group-hover:text-slate-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="flex items-center gap-2">
                      {item.label}
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                          item.badge === 'AI' ? 'bg-purple-600 text-white' :
                          item.badge === 'HOT' ? 'bg-red-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>PropFinder Competitor</span>
              <span className="text-green-400">v2.0</span>
            </div>
            <div>
              AI • Odds • Arbitrage • Kelly
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MainNavigation;
