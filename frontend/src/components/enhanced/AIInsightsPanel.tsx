import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  Target,
  Activity,
  BarChart3,
  Cpu,
  Eye,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { AIInsights, EnhancedPrediction, SHAPExplanation } from '../../types/enhancedBetting';

interface AIInsightsPanelProps {
  insights: AIInsights[];
  predictions: EnhancedPrediction[];
  selectedBet?: EnhancedPrediction;
  onBetSelect: (bet: EnhancedPrediction) => void;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  insights,
  predictions,
  selectedBet,
  onBetSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'quantum' | 'neural' | 'shap' | 'risk'>('quantum');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quantum']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Ensure safeInsights is always an array
  const safeInsights = Array.isArray(insights) ? insights : [];

  const selectedInsight =
    selectedBet && safeInsights.find((_, index) => predictions[index]?.id === selectedBet.id);

  const avgOpportunityScore =
    safeInsights.length > 0
      ? safeInsights.reduce((sum, insight) => sum + (insight.opportunity_score || 0), 0) /
        safeInsights.length
      : 0;
  const totalMarketEdge = safeInsights.reduce(
    (sum, insight) => sum + (insight.market_edge || 0),
    0
  );

  // Early return if no insights available
  if (safeInsights.length === 0) {
    return (
      <div className='bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-cyan-500/30 rounded-xl p-6'>
        <div className='flex items-center justify-center h-48'>
          <div className='text-center'>
            <Brain className='w-12 h-12 text-gray-600 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-400 mb-2'>No AI Insights Available</h3>
            <p className='text-sm text-gray-500'>
              Insights will appear here when predictions are loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-cyan-500/30 rounded-xl p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg'>
            <Brain className='w-6 h-6 text-purple-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>AI Insights</h3>
            <p className='text-sm text-gray-400'>Quantum & Neural Analysis</p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium'>
            {safeInsights.length} Analyses
          </div>
          <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
        </div>
      </div>

      {/* Global Insights Summary */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4'>
          <div className='flex items-center space-x-2 mb-2'>
            <Activity className='w-4 h-4 text-blue-400' />
            <span className='text-sm text-gray-400'>Avg Opportunity</span>
          </div>
          <div className='text-2xl font-bold text-blue-400'>{avgOpportunityScore.toFixed(1)}%</div>
        </div>

        <div className='bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4'>
          <div className='flex items-center space-x-2 mb-2'>
            <TrendingUp className='w-4 h-4 text-green-400' />
            <span className='text-sm text-gray-400'>Market Edge</span>
          </div>
          <div className='text-2xl font-bold text-green-400'>+{totalMarketEdge.toFixed(1)}%</div>
        </div>

        <div className='bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-lg p-4'>
          <div className='flex items-center space-x-2 mb-2'>
            <Cpu className='w-4 h-4 text-purple-400' />
            <span className='text-sm text-gray-400'>AI Confidence</span>
          </div>
          <div className='text-2xl font-bold text-purple-400'>
            {selectedBet ? selectedBet.quantum_confidence.toFixed(1) : '---'}%
          </div>
        </div>
      </div>

      {/* Bet Selector */}
      <div className='space-y-3'>
        <h4 className='text-sm font-semibold text-gray-300 flex items-center space-x-2'>
          <Target className='w-4 h-4' />
          <span>Select Bet for Analysis</span>
        </h4>
        <div className='max-h-32 overflow-y-auto space-y-2'>
          {predictions.slice(0, 5).map((bet, index) => (
            <motion.div
              key={bet.id}
              className={`p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
                selectedBet?.id === bet.id
                  ? 'bg-cyan-500/20 border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70 hover:border-gray-500/50'
              }`}
              onClick={() => onBetSelect(bet)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-sm font-medium text-white'>{bet.player_name}</div>
                  <div className='text-xs text-gray-400'>
                    {bet.stat_type} • {bet.team}
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-sm font-semibold text-cyan-400'>
                    {bet.confidence.toFixed(1)}%
                  </div>
                  <div className='text-xs text-gray-400'>+{bet.expected_value.toFixed(2)} EV</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detailed Analysis Sections */}
      {selectedBet && selectedInsight && (
        <div className='space-y-4'>
          {/* Quantum Analysis */}
          <div className='border border-gray-600/50 rounded-lg'>
            <button
              onClick={() => toggleSection('quantum')}
              className='w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors'
            >
              <div className='flex items-center space-x-3'>
                <Zap className='w-5 h-5 text-yellow-400' />
                <span className='font-semibold text-white'>Quantum Analysis</span>
              </div>
              {expandedSections.has('quantum') ? (
                <ChevronUp className='w-5 h-5 text-gray-400' />
              ) : (
                <ChevronDown className='w-5 h-5 text-gray-400' />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.has('quantum') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className='overflow-hidden'
                >
                  <div className='p-4 pt-0 space-y-3'>
                    <div className='bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4'>
                      <p className='text-sm text-gray-300 leading-relaxed'>
                        {selectedInsight.quantum_analysis}
                      </p>
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                      <div className='bg-gray-700/30 rounded-lg p-3'>
                        <div className='text-xs text-gray-400 mb-1'>Quantum Confidence</div>
                        <div className='text-lg font-bold text-yellow-400'>
                          {selectedBet.quantum_confidence.toFixed(1)}%
                        </div>
                      </div>
                      <div className='bg-gray-700/30 rounded-lg p-3'>
                        <div className='text-xs text-gray-400 mb-1'>Market Edge</div>
                        <div className='text-lg font-bold text-green-400'>
                          +{(selectedInsight.market_edge || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Neural Patterns */}
          <div className='border border-gray-600/50 rounded-lg'>
            <button
              onClick={() => toggleSection('neural')}
              className='w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors'
            >
              <div className='flex items-center space-x-3'>
                <Activity className='w-5 h-5 text-blue-400' />
                <span className='font-semibold text-white'>Neural Patterns</span>
              </div>
              {expandedSections.has('neural') ? (
                <ChevronUp className='w-5 h-5 text-gray-400' />
              ) : (
                <ChevronDown className='w-5 h-5 text-gray-400' />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.has('neural') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className='overflow-hidden'
                >
                  <div className='p-4 pt-0 space-y-3'>
                    <div className='space-y-2'>
                      {(selectedInsight.neural_patterns || []).map((pattern, index) => (
                        <div
                          key={index}
                          className='flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'
                        >
                          <div className='w-2 h-2 bg-blue-400 rounded-full'></div>
                          <span className='text-sm text-gray-300'>{pattern}</span>
                        </div>
                      ))}
                    </div>

                    <div className='bg-gray-700/30 rounded-lg p-3'>
                      <div className='text-xs text-gray-400 mb-1'>Neural Score</div>
                      <div className='text-lg font-bold text-blue-400'>
                        {selectedBet.neural_score.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SHAP Explanation */}
          <div className='border border-gray-600/50 rounded-lg'>
            <button
              onClick={() => toggleSection('shap')}
              className='w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors'
            >
              <div className='flex items-center space-x-3'>
                <BarChart3 className='w-5 h-5 text-purple-400' />
                <span className='font-semibold text-white'>Feature Importance (SHAP)</span>
              </div>
              {expandedSections.has('shap') ? (
                <ChevronUp className='w-5 h-5 text-gray-400' />
              ) : (
                <ChevronDown className='w-5 h-5 text-gray-400' />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.has('shap') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className='overflow-hidden'
                >
                  <div className='p-4 pt-0 space-y-3'>
                    <div className='space-y-2'>
                      {selectedBet.shap_explanation.top_factors.map(([factor, impact], index) => (
                        <div key={factor} className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-300 capitalize'>
                              {factor.replace(/_/g, ' ')}
                            </span>
                            <span className='text-sm font-medium text-white'>
                              {impact > 0 ? '+' : ''}
                              {impact.toFixed(1)}%
                            </span>
                          </div>
                          <div className='w-full bg-gray-700 rounded-full h-2'>
                            <div
                              className={`h-2 rounded-full ${
                                impact > 0 ? 'bg-green-400' : 'bg-red-400'
                              }`}
                              style={{
                                width: `${Math.min(Math.abs(impact), 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Risk Assessment */}
          <div className='border border-gray-600/50 rounded-lg'>
            <button
              onClick={() => toggleSection('risk')}
              className='w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors'
            >
              <div className='flex items-center space-x-3'>
                <AlertTriangle className='w-5 h-5 text-orange-400' />
                <span className='font-semibold text-white'>Risk Analysis</span>
              </div>
              {expandedSections.has('risk') ? (
                <ChevronUp className='w-5 h-5 text-gray-400' />
              ) : (
                <ChevronDown className='w-5 h-5 text-gray-400' />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.has('risk') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className='overflow-hidden'
                >
                  <div className='p-4 pt-0 space-y-3'>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='bg-gray-700/30 rounded-lg p-3'>
                        <div className='text-xs text-gray-400 mb-1'>Overall Risk</div>
                        <div
                          className={`text-lg font-bold ${
                            selectedBet.risk_assessment.overall_risk < 0.3
                              ? 'text-green-400'
                              : selectedBet.risk_assessment.overall_risk < 0.6
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }`}
                        >
                          {(selectedBet.risk_assessment.overall_risk * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className='bg-gray-700/30 rounded-lg p-3'>
                        <div className='text-xs text-gray-400 mb-1'>Risk Level</div>
                        <div
                          className={`text-sm font-bold uppercase ${
                            selectedBet.risk_assessment.risk_level === 'low'
                              ? 'text-green-400'
                              : selectedBet.risk_assessment.risk_level === 'medium'
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }`}
                        >
                          {selectedBet.risk_assessment.risk_level}
                        </div>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      {(selectedInsight.risk_factors || []).map((factor, index) => (
                        <div
                          key={index}
                          className='flex items-center space-x-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded'
                        >
                          <Info className='w-4 h-4 text-orange-400 flex-shrink-0' />
                          <span className='text-sm text-gray-300'>{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Confidence Reasoning */}
          <div className='bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4'>
            <h5 className='text-sm font-semibold text-cyan-400 mb-2 flex items-center space-x-2'>
              <Eye className='w-4 h-4' />
              <span>Confidence Reasoning</span>
            </h5>
            <p className='text-sm text-gray-300 leading-relaxed'>
              {selectedInsight.confidence_reasoning}
            </p>
          </div>
        </div>
      )}

      {/* No Selection State */}
      {!selectedBet && (
        <div className='text-center py-8'>
          <Brain className='w-12 h-12 text-gray-400 mx-auto mb-3' />
          <h4 className='text-lg font-semibold text-gray-300 mb-2'>Select a Bet for AI Analysis</h4>
          <p className='text-sm text-gray-400'>
            Choose a bet above to see detailed quantum analysis, neural patterns, and risk
            assessment
          </p>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
