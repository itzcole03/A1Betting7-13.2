import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Zap,
  Eye,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  StackSuggestion,
  CorrelationMatrix,
  EnhancedPrediction,
} from '../../types/enhancedBetting';

interface SmartStackingPanelProps {
  suggestions: StackSuggestion[];
  correlationMatrix: CorrelationMatrix;
  predictions: EnhancedPrediction[];
  onStackSelect: (playerIds: string[]) => void;
  selectedBets: Set<string>;
}

const _SmartStackingPanel: React.FC<SmartStackingPanelProps> = ({
  suggestions,
  correlationMatrix,
  predictions,
  onStackSelect,
  selectedBets,
}) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'correlations'>('suggestions');
  const [selectedStack, setSelectedStack] = useState<StackSuggestion | null>(null);

  const _getCorrelationColor = (correlation: number) => {
    if (correlation > 0.7) return 'text-red-400';
    if (correlation > 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const _getCorrelationBg = (correlation: number) => {
    if (correlation > 0.7) return 'bg-red-500/20';
    if (correlation > 0.4) return 'bg-yellow-500/20';
    return 'bg-green-500/20';
  };

  const _getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'high':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const _handleStackSelect = (suggestion: StackSuggestion) => {
    const _playerIds = suggestion.players
      .map(playerName => predictions.find(p => p.player_name === playerName)?.id)
      .filter(Boolean) as string[];

    onStackSelect(playerIds);
    setSelectedStack(suggestion);
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 space-y-6'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center justify-between'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Users className='w-6 h-6 text-purple-400' />
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Smart Stacking</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-sm text-gray-400'>Player Correlation & Synergy Analysis</p>
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium'>
            {suggestions.length} Stacks
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='w-2 h-2 bg-purple-400 rounded-full animate-pulse'></div>
        </div>
      </div>

      {/* Tab Navigation */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex space-x-2 bg-gray-700/30 rounded-lg p-1'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'suggestions'
              ? 'bg-purple-500/20 text-purple-400 shadow-lg'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Stack Suggestions
        </button>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <button
          onClick={() => setActiveTab('correlations')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'correlations'
              ? 'bg-purple-500/20 text-purple-400 shadow-lg'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Correlation Matrix
        </button>
      </div>

      {/* Stack Suggestions Tab */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <AnimatePresence mode='wait'>
        {activeTab === 'suggestions' && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    selectedStack === suggestion
                      ? 'bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/10'
                      : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500/50'
                  }`}
                  onClick={() => handleStackSelect(suggestion)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-start justify-between mb-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-3'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div
                        className={`p-2 rounded-lg ${getCorrelationBg(suggestion.correlation_score)}`}
                      >
                        {suggestion.type === 'team' ? (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Users className='w-5 h-5 text-white' />
                        ) : suggestion.type === 'game' ? (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Target className='w-5 h-5 text-white' />
                        ) : (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <BarChart3 className='w-5 h-5 text-white' />
                        )}
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='font-medium text-white capitalize'>
                          {suggestion.type} Stack
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-sm text-gray-400'>
                          {suggestion.players.length} players
                        </div>
                      </div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-right'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm font-semibold text-purple-400'>
                        +{suggestion.expected_boost.toFixed(1)}% boost
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className={`text-xs font-medium ${getRiskColor(suggestion.risk_level)}`}>
                        {suggestion.risk_level.toUpperCase()} RISK
                      </div>
                    </div>
                  </div>

                  {/* Players in Stack */}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='space-y-2 mb-3'>
                    {suggestion.players.map((playerName, playerIndex) => {
                      const _prediction = predictions.find(p => p.player_name === playerName);
                      const _isSelected = prediction && selectedBets.has(prediction.id);

                      return (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          key={playerIndex}
                          className={`flex items-center justify-between p-2 rounded border ${
                            isSelected
                              ? 'bg-green-500/20 border-green-400/50'
                              : 'bg-gray-600/30 border-gray-500/30'
                          }`}
                        >
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center space-x-2'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            {isSelected && <CheckCircle className='w-4 h-4 text-green-400' />}
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span className='text-sm text-white'>{playerName}</span>
                            {prediction && (
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-xs text-gray-400'>
                                • {prediction.stat_type}
                              </span>
                            )}
                          </div>
                          {prediction && (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='text-xs text-gray-400'>
                              {prediction.confidence.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stack Metrics */}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-3 gap-3 mb-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-center'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-400'>Correlation</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div
                        className={`text-sm font-semibold ${getCorrelationColor(suggestion.correlation_score)}`}
                      >
                        {(suggestion.correlation_score * 100).toFixed(0)}%
                      </div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-center'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-400'>Synergy</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm font-semibold text-blue-400'>
                        {(suggestion.synergy_rating * 100).toFixed(0)}%
                      </div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-center'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-400'>Expected Boost</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm font-semibold text-green-400'>
                        +{suggestion.expected_boost.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='bg-gray-600/20 rounded p-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-300'>{suggestion.explanation}</p>
                  </div>

                  {/* Action Button */}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='mt-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.button
                      className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all duration-300'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={e => {
                        e.stopPropagation();
                        handleStackSelect(suggestion);
                      }}
                    >
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Plus className='w-4 h-4' />
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span>Apply Stack</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <ArrowRight className='w-4 h-4' />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            ) : (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-center py-8'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Users className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h4 className='text-lg font-semibold text-gray-300 mb-2'>
                  No Stacking Opportunities
                </h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-sm text-gray-400'>
                  Add more players from the same team or game to discover stacking synergies
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Correlation Matrix Tab */}
        {activeTab === 'correlations' && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            key='correlations'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='space-y-4'
          >
            {correlationMatrix.players.length > 0 ? (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <>
                {/* Correlation Heatmap */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='bg-gray-700/30 rounded-lg p-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h4 className='text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Eye className='w-4 h-4' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span>Player Correlation Heatmap</span>
                  </h4>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='overflow-x-auto'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <table className='w-full text-xs'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <thead>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <tr>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <th className='p-2 text-left text-gray-400'>Player</th>
                          {correlationMatrix.players.map((player, index) => (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <th key={index} className='p-2 text-center text-gray-400 min-w-16'>
                              {player.split(' ')[0]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <tbody>
                        {correlationMatrix.players.map((playerA, i) => (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <tr key={i}>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <td className='p-2 text-gray-300 font-medium'>
                              {playerA.split(' ')[0]}
                            </td>
                            {correlationMatrix.players.map((playerB, j) => {
                              const _correlation = correlationMatrix.matrix[i][j];
                              return (
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <td key={j} className='p-2 text-center'>
                                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                  <div
                                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium mx-auto ${
                                      correlation > 0.7
                                        ? 'bg-red-500/30 text-red-400'
                                        : correlation > 0.4
                                          ? 'bg-yellow-500/30 text-yellow-400'
                                          : 'bg-green-500/30 text-green-400'
                                    }`}
                                  >
                                    {correlation.toFixed(1)}
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

                {/* Correlation Insights */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='space-y-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h4 className='text-sm font-semibold text-gray-300 flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <TrendingUp className='w-4 h-4' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span>Correlation Insights</span>
                  </h4>

                  {correlationMatrix.insights.map((insight, index) => (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center justify-between mb-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center space-x-2'>
                          {insight.recommendation === 'STACK' ? (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <CheckCircle className='w-4 h-4 text-green-400' />
                          ) : insight.recommendation === 'AVOID' ? (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <AlertTriangle className='w-4 h-4 text-red-400' />
                          ) : (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Eye className='w-4 h-4 text-gray-400' />
                          )}
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-sm font-medium text-white'>
                            {insight.player_a} ↔ {insight.player_b}
                          </span>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span
                          className={`text-sm font-semibold ${getCorrelationColor(insight.correlation)}`}
                        >
                          {(insight.correlation * 100).toFixed(0)}%
                        </span>
                      </div>

                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-400'>
                        {insight.recommendation === 'STACK' &&
                          'Strong positive correlation - excellent stacking opportunity'}
                        {insight.recommendation === 'AVOID' &&
                          'High correlation - avoid over-concentration risk'}
                        {insight.recommendation === 'NEUTRAL' &&
                          'Moderate correlation - neutral stacking value'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='bg-gray-700/30 rounded-lg p-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h4 className='text-sm font-semibold text-gray-300 mb-3'>Correlation Guide</h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-3 gap-4 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='w-4 h-4 bg-green-500/30 rounded'></div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Low (0-40%) - Safe to stack</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='w-4 h-4 bg-yellow-500/30 rounded'></div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Medium (40-70%) - Use caution</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='w-4 h-4 bg-red-500/30 rounded'></div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>High (70%+) - Avoid stacking</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-center py-8'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <BarChart3 className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h4 className='text-lg font-semibold text-gray-300 mb-2'>No Correlation Data</h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-sm text-gray-400'>
                  Select multiple players to see correlation analysis
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartStackingPanel;
