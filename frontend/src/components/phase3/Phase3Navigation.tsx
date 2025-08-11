/**
 * Phase 3 Navigation Component
 * Provides navigation for Phase 3 unified architecture features
 */

import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  BarChart3 as ChartBarIcon,
  Cpu as CpuChipIcon,
  Sparkles as SparklesIcon,
  TestTube as BeakerIcon,
  Settings as CogIcon,
  FileText as DocumentTextIcon
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  description: string;
  badge?: string;
}

export const Phase3Navigation: React.FC = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Unified Dashboard',
      path: '/phase3/dashboard',
      icon: HomeIcon,
      description: 'Overview of unified architecture',
      badge: 'NEW'
    },
    {
      id: 'predictions',
      label: 'Advanced Predictions',
      path: '/phase3/predictions',
      icon: SparklesIcon,
      description: 'ML predictions with SHAP explanations'
    },
    {
      id: 'analytics',
      label: 'Real-time Analytics',
      path: '/phase3/analytics',
      icon: ChartBarIcon,
      description: 'Performance monitoring and insights'
    },
    {
      id: 'domains',
      label: 'Domain Architecture',
      path: '/phase3/domains',
      icon: CpuChipIcon,
      description: '5 unified domain services'
    },
    {
      id: 'testing',
      label: 'System Testing',
      path: '/phase3/testing',
      icon: BeakerIcon,
      description: 'Comprehensive testing suite'
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      path: '/phase3/admin',
      icon: CogIcon,
      description: 'System administration tools'
    },
    {
      id: 'docs',
      label: 'API Documentation',
      path: '/phase3/docs',
      icon: DocumentTextIcon,
      description: 'Interactive OpenAPI docs'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border-r border-purple-500/30 min-h-screen w-64 fixed left-0 top-0 z-40">
      {/* Header */}
      <div className="p-6 border-b border-purple-500/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">A1</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">A1Betting</h1>
            <p className="text-purple-300 text-sm">Phase 3</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`block p-3 rounded-xl transition-all duration-200 group ${
                active
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-purple-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium truncate">{item.label}</span>
                    {item.badge && (
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${
                    active ? 'text-purple-100' : 'text-purple-400'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status Indicator */}
      <div className="absolute bottom-6 left-4 right-4">
        <div className="bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <p className="text-white text-sm font-medium">System Status</p>
              <p className="text-green-400 text-xs">All systems operational</p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-purple-500/30">
            <div className="text-xs text-purple-300">
              <div className="flex justify-between mb-1">
                <span>Response Time</span>
                <span className="text-green-400">85ms</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Hit Rate</span>
                <span className="text-green-400">95.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase3Navigation;
