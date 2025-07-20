import { motion } from 'framer-motion';
import React from 'react';
import { useKeyMetrics, useLiveOpportunities, useMlModelStats } from './hooks';

const Dashboard = () => {
  const keyMetrics = useKeyMetrics();
  const liveOpportunities = useLiveOpportunities();
  const mlModelStats = useMlModelStats();

  return (
    <div className='p-6 space-y-8'>
      {/* Key Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {keyMetrics.map((metric, index) => (
          <React.Fragment key={metric.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className='group relative overflow-hidden'
            >
              <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
                <div className='relative flex items-start justify-between'>
                  <div className='flex-1'>
                    <p className='text-gray-400 text-sm font-medium'>{metric.title}</p>
                    <p className='text-2xl font-bold text-white mt-1'>{metric.value}</p>
                    <p className='text-xs text-gray-500 mt-1'>{metric.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        ))}
      </div>

      {/* Live Opportunities */}
      <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
        <h3 className='text-xl font-bold text-white mb-6'>Live Opportunities</h3>
        <div className='space-y-4 max-h-96 overflow-y-auto'>
          {liveOpportunities.length === 0 ? (
            <div className='text-gray-400'>No live opportunities available.</div>
          ) : (
            <React.Fragment>
              {liveOpportunities.slice(0, 8).map(opp => (
                <div
                  key={opp.id}
                  className='bg-slate-900/30 border border-slate-700/30 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='font-medium text-white'>{opp.game}</div>
                    <div className='text-cyan-400 font-bold'>+{opp.roi}% ROI</div>
                  </div>
                  <div className='text-sm text-gray-300 mb-2'>{opp.type}</div>
                  <div className='flex items-center justify-between text-sm mb-2'>
                    <span className='text-gray-400'>
                      Stake: ${opp.stake} • Profit: +${opp.expectedProfit}
                    </span>
                    <span className='text-green-400 font-medium'>{opp.confidence}% confidence</span>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )}
        </div>
      </div>

      {/* ML Model Performance */}
      <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
        <h3 className='text-xl font-bold text-white mb-6'>ML Model Performance</h3>
        <div className='space-y-4'>
          {mlModelStats.length === 0 ? (
            <div className='text-gray-400'>No ML model stats available.</div>
          ) : (
            <React.Fragment>
              {mlModelStats.map((model, index) => (
                <div
                  key={model.name || index}
                  className='bg-slate-900/30 border border-slate-700/30 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='font-medium text-white'>{model.name}</div>
                    <div className='flex items-center space-x-2'>
                      <span className='text-green-400 text-sm font-medium'>
                        {model.accuracy ? `${model.accuracy}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-400'>
                      AUC: {model.auc ?? 'N/A'} • F1: {model.f1_score ?? 'N/A'}
                    </span>
                    <span className='text-purple-400 text-sm'>
                      {model.last_trained ? `Trained: ${model.last_trained}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
