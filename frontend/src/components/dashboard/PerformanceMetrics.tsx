import { Target, TrendingUp, Zap } from 'lucide-react';
import React, { useMemo } from 'react';
import { PropOpportunity } from '../../hooks/usePropFinderData';

interface PerformanceMetricsProps {
  opportunities: PropOpportunity[];
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ opportunities }) => {
  const avgEV = useMemo(() => {
    if (opportunities.length === 0) return 0;
    const sum = opportunities.reduce((acc, opp) => acc + (opp.ev || 0), 0);
    return sum / opportunities.length;
  }, [opportunities]);

  const highValueCount = useMemo(() => {
    return opportunities.filter(opp => (opp.ev || 0) >= 5).length;
  }, [opportunities]);

  const arbitrageCount = useMemo(() => {
    return opportunities.filter(opp => opp.isArbitrage).length;
  }, [opportunities]);

  const totalOpportunities = opportunities.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Opportunities</p>
            <p className="text-3xl font-bold text-white mt-1">{totalOpportunities}</p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Average EV</p>
            <p className="text-3xl font-bold text-cyan-400 mt-1">{avgEV.toFixed(2)}%</p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <div className={`text-xs ${avgEV >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
            {avgEV >= 3 ? '↑ Excellent' : avgEV >= 1 ? '→ Good' : '↓ Fair'}
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">High Value Plays</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{highValueCount}</p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <Zap className="w-6 h-6 text-green-400" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xs text-slate-400">
            {totalOpportunities > 0 ? `${((highValueCount / totalOpportunities) * 100).toFixed(1)}% of total` : '0%'}
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Arbitrage Opps</p>
            <p className="text-3xl font-bold text-purple-400 mt-1">{arbitrageCount}</p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xs text-slate-400">
            {arbitrageCount > 0 ? 'Risk-free profits available' : 'No arbitrage found'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
