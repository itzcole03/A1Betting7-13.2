import React from 'react';
import { BarChart3, TrendingUp, Activity, Zap } from 'lucide-react';

const AdvancedAnalyticsPanel: React.FC = () => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Advanced Analytics</h3>
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-gray-400">Real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Market Efficiency</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">84.7%</div>
          <div className="text-xs text-green-400">+2.1% vs yesterday</div>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">AI Accuracy</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">92.3%</div>
          <div className="text-xs text-cyan-400">Live tracking</div>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Edge Discovery</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">156</div>
          <div className="text-xs text-yellow-400">Opportunities found</div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPanel;
