import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, AlertTriangle, CheckCircle, Target, BarChart3, Eye, ArrowRight, Plus } from 'lucide-react';
import { StackSuggestion, CorrelationMatrix, EnhancedPrediction } from '../../types/enhancedBetting';

interface SmartStackingPanelProps {
  suggestions: StackSuggestion[];
  correlationMatrix: CorrelationMatrix;
  predictions: EnhancedPrediction[];
  onStackSelect: (playerIds: string[]) => void;
  selectedBets: Set<string>;
}

const SmartStackingPanel: React.FC<SmartStackingPanelProps> = ({
  suggestions,
  correlationMatrix,
  predictions,
  onStackSelect,
  selectedBets
}) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'correlations'>('suggestions');
  const [selectedStack, setSelectedStack] = useState<StackSuggestion | null>(null);

  const handleKeyActivate = (cb: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cb();
    }
  };

  const correlationColor = (c: number) => (c > 0.7 ? 'text-red-400' : c > 0.4 ? 'text-yellow-400' : 'text-green-400');
  const correlationBg = (c: number) => (c > 0.7 ? 'bg-red-500/20' : c > 0.4 ? 'bg-yellow-500/20' : 'bg-green-500/20');
  const riskColor = (r: string) => (r === 'low' ? 'text-green-400' : r === 'medium' ? 'text-yellow-400' : r === 'high' ? 'text-red-400' : 'text-gray-400');

  const handleStackSelect = (suggestion: StackSuggestion) => {
    const playerIds = suggestion.players
      .map(name => predictions.find(p => p.player_name === name)?.id)
      .filter(Boolean) as string[];
    if (playerIds.length) onStackSelect(playerIds);
    setSelectedStack(suggestion);
  };

  return (
    <div className='bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg'>
            <Users className='w-6 h-6 text-purple-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Smart Stacking</h3>
            <p className='text-sm text-gray-400'>Player Correlation & Synergy Analysis</p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium'>
            {suggestions.length} Stacks
          </div>
          <div className='w-2 h-2 bg-purple-400 rounded-full animate-pulse' />
        </div>
      </div>

      <div className='flex space-x-2 bg-gray-700/30 rounded-lg p-1'>
        {(['suggestions', 'correlations'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-purple-500/20 text-purple-400 shadow-lg'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab === 'suggestions' ? 'Stack Suggestions' : 'Correlation Matrix'}
          </button>
        ))}
      </div>

      <AnimatePresence mode='wait'>
        {activeTab === 'suggestions' && (
          <motion.div
            key='suggestions'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='space-y-4'
          >
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition duration-150 ease-out cursor-pointer transform hover:scale-[1.02] active:scale-[0.97] focus-visible:scale-[1.02] focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus:outline-none ${
                    selectedStack === suggestion
                      ? 'bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/10'
                      : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500/50'
                  }`}
                  onClick={() => handleStackSelect(suggestion)}
                  tabIndex={0}
                  role='button'
                  onKeyDown={handleKeyActivate(() => handleStackSelect(suggestion))}
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <div className={`p-2 rounded-lg ${correlationBg(suggestion.correlation_score)}`}>
                        {suggestion.type === 'team' ? (
                          <Users className='w-5 h-5 text-white' />
                        ) : suggestion.type === 'game' ? (
                          <Target className='w-5 h-5 text-white' />
                        ) : (
                          <BarChart3 className='w-5 h-5 text-white' />
                        )}
                      </div>
                      <div>
                        <div className='font-medium text-white capitalize'>{suggestion.type} Stack</div>
                        <div className='text-sm text-gray-400'>{suggestion.players.length} players</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-semibold text-purple-400'>+{suggestion.expected_boost.toFixed(1)}% boost</div>
                      <div className={`text-xs font-medium ${riskColor(suggestion.risk_level)}`}>
                        {suggestion.risk_level.toUpperCase()} RISK
                      </div>
                    </div>
                  </div>

                  <div className='space-y-2 mb-3'>
                    {suggestion.players.map((playerName, playerIndex) => {
                      const prediction = predictions.find(p => p.player_name === playerName);
                      const isSelected = prediction ? selectedBets.has(prediction.id) : false;
                      return (
                        <div
                          key={playerIndex}
                          className={`flex items-center justify-between p-2 rounded border ${
                            isSelected
                              ? 'bg-green-500/20 border-green-400/50'
                              : 'bg-gray-600/30 border-gray-500/30'
                          }`}
                        >
                          <div className='flex items-center space-x-2'>
                            {isSelected && <CheckCircle className='w-4 h-4 text-green-400' />}
                            <span className='text-sm text-white'>{playerName}</span>
                            {prediction && (
                              <span className='text-xs text-gray-400'>• {prediction.stat_type}</span>
                            )}
                          </div>
                          {prediction && (
                            <div className='text-xs text-gray-400'>{prediction.confidence.toFixed(1)}%</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className='grid grid-cols-3 gap-3 mb-3'>
                    <div className='text-center'>
                      <div className='text-xs text-gray-400'>Correlation</div>
                      <div className={`text-sm font-semibold ${correlationColor(suggestion.correlation_score)}`}>
                        {(suggestion.correlation_score * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-xs text-gray-400'>Synergy</div>
                      <div className='text-sm font-semibold text-blue-400'>
                        {(suggestion.synergy_rating * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-xs text-gray-400'>Expected Boost</div>
                      <div className='text-sm font-semibold text-green-400'>+{suggestion.expected_boost.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className='bg-gray-600/20 rounded p-3'>
                    <p className='text-sm text-gray-300'>{suggestion.explanation}</p>
                  </div>

                  <div className='mt-3'>
                    <button
                      className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97] focus-visible:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50'
                      onClick={e => {
                        e.stopPropagation();
                        handleStackSelect(suggestion);
                      }}
                      onKeyDown={handleKeyActivate(() => handleStackSelect(suggestion))}
                    >
                      <Plus className='w-4 h-4' />
                      <span>Apply Stack</span>
                      <ArrowRight className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-8'>
                <Users className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                <h4 className='text-lg font-semibold text-gray-300 mb-2'>No Stacking Opportunities</h4>
                <p className='text-sm text-gray-400'>Add more players from the same team or game to discover stacking synergies</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'correlations' && (
          <motion.div
            key='correlations'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='space-y-4'
          >
            {correlationMatrix.players.length > 0 ? (
              <>
                <div className='bg-gray-700/30 rounded-lg p-4'>
                  <h4 className='text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2'>
                    <Eye className='w-4 h-4' />
                    <span>Player Correlation Heatmap</span>
                  </h4>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-xs'>
                      <thead>
                        <tr>
                          <th className='p-2 text-left text-gray-400'>Player</th>
                          {correlationMatrix.players.map((player, index) => (
                            <th key={index} className='p-2 text-center text-gray-400 min-w-16'>
                              {player.split(' ')[0]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {correlationMatrix.players.map((playerA, i) => (
                          <tr key={i}>
                            <td className='p-2 text-gray-300 font-medium'>{playerA.split(' ')[0]}</td>
                            {correlationMatrix.players.map((_playerB, j) => {
                              const c = correlationMatrix.matrix[i][j];
                              return (
                                <td key={j} className='p-2 text-center'>
                                  <div
                                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium mx-auto ${
                                      c > 0.7
                                        ? 'bg-red-500/30 text-red-400'
                                        : c > 0.4
                                          ? 'bg-yellow-500/30 text-yellow-400'
                                          : 'bg-green-500/30 text-green-400'
                                    }`}
                                  >
                                    {c.toFixed(1)}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className='space-y-3'>
                  <h4 className='text-sm font-semibold text-gray-300 flex items-center space-x-2'>
                    <TrendingUp className='w-4 h-4' />
                    <span>Correlation Insights</span>
                  </h4>
                  {correlationMatrix.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        insight.recommendation === 'STACK'
                          ? 'bg-green-500/10 border-green-500/20'
                          : insight.recommendation === 'AVOID'
                            ? 'bg-red-500/10 border-red-500/20'
                            : 'bg-gray-500/10 border-gray-500/20'
                      }`}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center space-x-2'>
                          {insight.recommendation === 'STACK' ? (
                            <CheckCircle className='w-4 h-4 text-green-400' />
                          ) : insight.recommendation === 'AVOID' ? (
                            <AlertTriangle className='w-4 h-4 text-red-400' />
                          ) : (
                            <Eye className='w-4 h-4 text-gray-400' />
                          )}
                          <span className='text-sm font-medium text-white'>
                            {insight.player_a} ↔ {insight.player_b}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold ${correlationColor(insight.correlation)}`}>
                          {(insight.correlation * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className='text-xs text-gray-400'>
                        {insight.recommendation === 'STACK' && 'Strong positive correlation - excellent stacking opportunity'}
                        {insight.recommendation === 'AVOID' && 'High correlation - avoid over-concentration risk'}
                        {insight.recommendation === 'NEUTRAL' && 'Moderate correlation - neutral stacking value'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='bg-gray-700/30 rounded-lg p-4'>
                  <h4 className='text-sm font-semibold text-gray-300 mb-3'>Correlation Guide</h4>
                  <div className='grid grid-cols-3 gap-4 text-xs'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 bg-green-500/30 rounded' />
                      <span className='text-gray-400'>Low (0-40%) - Safe to stack</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 bg-yellow-500/30 rounded' />
                      <span className='text-gray-400'>Medium (40-70%) - Use caution</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 bg-red-500/30 rounded' />
                      <span className='text-gray-400'>High (70%+) - Avoid stacking</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className='text-center py-8'>
                <BarChart3 className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                <h4 className='text-lg font-semibold text-gray-300 mb-2'>No Correlation Data</h4>
                <p className='text-sm text-gray-400'>Select multiple players to see correlation analysis</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartStackingPanel;
