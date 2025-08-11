/**
 * Phase 3 Layout Component
 * Main layout for Phase 3 unified architecture features
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Phase3Navigation from './Phase3Navigation';

export const Phase3Layout: React.FC = () => {
  const location = useLocation();

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Unified Dashboard';
    if (path.includes('/predictions')) return 'Advanced Predictions';
    if (path.includes('/analytics')) return 'Real-time Analytics';
    if (path.includes('/domains')) return 'Domain Architecture';
    if (path.includes('/testing')) return 'System Testing';
    if (path.includes('/admin')) return 'Admin Panel';
    if (path.includes('/docs')) return 'API Documentation';
    return 'Phase 3';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Sidebar */}
      <Phase3Navigation />

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Header Bar */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/30 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{getPageTitle()}</h1>
              <p className="text-purple-300 text-sm">A1Betting Unified Architecture</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">91.2%</div>
                <div className="text-xs text-purple-300">Route Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">96.7%</div>
                <div className="text-xs text-purple-300">Service Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">73%</div>
                <div className="text-xs text-purple-300">Complexity Reduction</div>
              </div>
              <div className="w-px h-8 bg-purple-500/30"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Phase 3 Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Phase3Layout;
