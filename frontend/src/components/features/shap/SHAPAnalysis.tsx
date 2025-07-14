import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Brain,
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Download,
  Settings,
  Cpu,
  Zap,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface SHAPValue {
  feature: string;
  value: number;
  baseValue: number;
  contribution: number;
  impact: 'positive' | 'negative' | 'neutral';
  importance: number;
  category: string;
  description: string;
}

interface PredictionAnalysis {
  id: string;
  gameId: string;
  market: string;
  prediction: number;
  confidence: number;
  modelId: string;
  shapValues: SHAPValue[];
  globalExplanation: {
    topFeatures: string[];
    modelBias: number;
    expectedValue: number;
  };
  localExplanation: {
    finalPrediction: number;
    baseValue: number;
    featureContributions: Record<string, number>;
  };
  timestamp: Date;
}

interface FeatureInteraction {
  feature1: string;
  feature2: string;
  interactionValue: number;
  explanation: string;
  strength: 'weak' | 'moderate' | 'strong';
}

interface ModelInterpretability {
  modelId: string;
  modelName: string;
  globalImportance: Array<{
    feature: string;
    importance: number;
    category: string;
  }>;
  featureInteractions: FeatureInteraction[];
  averageShapValues: Record<string, number>;
  explanationQuality: number;
}

const SHAPAnalysis: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionAnalysis[]>([]);
  const [modelInterpretability, setModelInterpretability] = useState<ModelInterpretability[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'prediction' | 'global' | 'interactions'>('prediction');
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSHAPData();
  }, [selectedModel]);

  const loadSHAPData = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockPredictions: PredictionAnalysis[] = [
        {
          id: 'pred-001',
          gameId: 'Lakers vs Warriors',
          market: 'Over 225.5 Total Points',
          prediction: 0.87,
          confidence: 94.2,
          modelId: 'xgb-ensemble',
          shapValues: [
            {
              feature: 'Team Pace',
              value: 108.5,
              baseValue: 102.3,
              contribution: 0.23,
              impact: 'positive',
              importance: 0.18,
              category: 'Game Flow',
              description: 'Both teams play at fast pace, increasing total points',
            },
            {
              feature: 'Offensive Rating',
              value: 118.2,
              baseValue: 112.1,
              contribution: 0.19,
              impact: 'positive',
              importance: 0.15,
              category: 'Team Performance',
              description: 'High offensive efficiency suggests more scoring',
            },
            {
              feature: 'Rest Days',
              value: 1,
              baseValue: 2.1,
              contribution: -0.08,
              impact: 'negative',
              importance: 0.12,
              category: 'Schedule',
              description: 'Less rest may lead to fatigue and lower scoring',
            },
            {
              feature: 'Home Court Advantage',
              value: 1,
              baseValue: 0.5,
              contribution: 0.15,
              impact: 'positive',
              importance: 0.11,
              category: 'Context',
              description: 'Home team tends to score more points',
            },
            {
              feature: 'Player Injuries',
              value: 0.2,
              baseValue: 0.1,
              contribution: -0.12,
              impact: 'negative',
              importance: 0.09,
              category: 'Health',
              description: 'Minor injuries may reduce offensive output',
            },
            {
              feature: 'Weather Conditions',
              value: 0.9,
              baseValue: 0.5,
              contribution: 0.06,
              impact: 'positive',
              importance: 0.08,
              category: 'Environment',
              description: 'Indoor game with controlled conditions',
            },
          ],
          globalExplanation: {
            topFeatures: ['Team Pace', 'Offensive Rating', 'Rest Days', 'Home Court Advantage'],
            modelBias: 0.52,
            expectedValue: 0.68,
          },
          localExplanation: {
            finalPrediction: 0.87,
            baseValue: 0.52,
            featureContributions: {
              'Team Pace': 0.23,
              'Offensive Rating': 0.19,
              'Rest Days': -0.08,
              'Home Court Advantage': 0.15,
              'Player Injuries': -0.12,
              'Weather Conditions': 0.06,
            },
          },
          timestamp: new Date(),
        },
        {
          id: 'pred-002',
          gameId: 'Chiefs vs Bills',
          market: 'Chiefs -3.5',
          prediction: 0.72,
          confidence: 86.5,
          modelId: 'lstm-model',
          shapValues: [
            {
              feature: 'QB Rating',
              value: 112.4,
              baseValue: 95.2,
              contribution: 0.28,
              impact: 'positive',
              importance: 0.22,
              category: 'Player Performance',
              description: 'Elite quarterback performance favors Chiefs',
            },
            {
              feature: 'Weather Impact',
              value: 0.7,
              baseValue: 0.3,
              contribution: -0.15,
              impact: 'negative',
              importance: 0.16,
              category: 'Environment',
              description: 'Windy conditions may hurt passing game',
            },
            {
              feature: 'Defensive Ranking',
              value: 8,
              baseValue: 15,
              contribution: 0.18,
              impact: 'positive',
              importance: 0.14,
              category: 'Team Performance',
              description: 'Strong defense supports spread coverage',
            },
          ],
          globalExplanation: {
            topFeatures: ['QB Rating', 'Weather Impact', 'Defensive Ranking'],
            modelBias: 0.48,
            expectedValue: 0.62,
          },
          localExplanation: {
            finalPrediction: 0.72,
            baseValue: 0.48,
            featureContributions: {
              'QB Rating': 0.28,
              'Weather Impact': -0.15,
              'Defensive Ranking': 0.18,
            },
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
      ];

      const mockModels: ModelInterpretability[] = [
        {
          modelId: 'xgb-ensemble',
          modelName: 'XGBoost Ensemble',
          globalImportance: [
            { feature: 'Team Pace', importance: 0.18, category: 'Game Flow' },
            { feature: 'Offensive Rating', importance: 0.15, category: 'Team Performance' },
            { feature: 'Player Health', importance: 0.13, category: 'Health' },
            { feature: 'Rest Days', importance: 0.12, category: 'Schedule' },
            { feature: 'Home Advantage', importance: 0.11, category: 'Context' },
            { feature: 'Weather', importance: 0.08, category: 'Environment' },
            { feature: 'Referee Tendency', importance: 0.07, category: 'Officials' },
            { feature: 'Public Betting', importance: 0.06, category: 'Market' },
          ],
          featureInteractions: [
            {
              feature1: 'Team Pace',
              feature2: 'Offensive Rating',
              interactionValue: 0.12,
              explanation: 'Fast pace amplifies the effect of high offensive rating',
              strength: 'strong',
            },
            {
              feature1: 'Weather',
              feature2: 'QB Rating',
              interactionValue: -0.08,
              explanation: 'Bad weather reduces the impact of quarterback skill',
              strength: 'moderate',
            },
          ],
          averageShapValues: {
            'Team Pace': 0.15,
            'Offensive Rating': 0.12,
            'Player Health': -0.08,
            Weather: 0.05,
          },
          explanationQuality: 0.89,
        },
      ];

      setPredictions(mockPredictions);
      setModelInterpretability(mockModels);
    } catch (error) {
      console.error('Failed to load SHAP data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleFeatureExpansion = (feature: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(feature)) {
      newExpanded.delete(feature);
    } else {
      newExpanded.add(feature);
    }
    setExpandedFeatures(newExpanded);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-400 bg-green-500/20';
      case 'negative':
        return 'text-red-400 bg-red-500/20';
      case 'neutral':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getContributionBarColor = (contribution: number) => {
    if (contribution > 0) return 'bg-green-400';
    if (contribution < 0) return 'bg-red-400';
    return 'bg-gray-400';
  };

  const getInteractionStrength = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'text-red-400 bg-red-500/20';
      case 'moderate':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'weak':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const selectedPredictionData = predictions.find(p => p.id === selectedPrediction);

  return (
    <Layout
      title='SHAP Analysis'
      subtitle='Model Explainability & Feature Impact Analysis'
      headerActions={
        <div className='flex items-center space-x-3'>
          <select
            value={viewMode}
            onChange={e => setViewMode(e.target.value as any)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            <option value='prediction'>Prediction Analysis</option>
            <option value='global'>Global Importance</option>
            <option value='interactions'>Feature Interactions</option>
          </select>

          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            <option value='all'>All Models</option>
            <option value='xgb-ensemble'>XGBoost Ensemble</option>
            <option value='lstm-model'>LSTM Model</option>
            <option value='rf-model'>Random Forest</option>
          </select>

          <button
            onClick={loadSHAPData}
            disabled={isAnalyzing}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Analyze</span>
          </button>
        </div>
      }
    >
      {viewMode === 'prediction' && (
        <>
          {/* Prediction Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-8'
          >
            <h3 className='text-lg font-bold text-white mb-4'>Recent Predictions</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {predictions.map(prediction => (
                <button
                  key={prediction.id}
                  onClick={() => setSelectedPrediction(prediction.id)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    selectedPrediction === prediction.id
                      ? 'border-cyan-500/50 bg-cyan-500/10'
                      : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600/50'
                  }`}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='font-bold text-white'>{prediction.gameId}</h4>
                    <span className='text-green-400 font-medium'>
                      {prediction.confidence.toFixed(1)}%
                    </span>
                  </div>
                  <div className='text-sm text-gray-400 mb-1'>{prediction.market}</div>
                  <div className='text-sm text-gray-400'>
                    Model: {prediction.modelId} • {prediction.timestamp.toLocaleTimeString()}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* SHAP Analysis Details */}
          {selectedPredictionData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='space-y-8'
            >
              {/* Prediction Summary */}
              <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div>
                    <h3 className='text-xl font-bold text-white'>
                      {selectedPredictionData.gameId}
                    </h3>
                    <p className='text-gray-400'>{selectedPredictionData.market}</p>
                  </div>
                  <div className='text-right'>
                    <div className='text-3xl font-bold text-green-400'>
                      {(selectedPredictionData.prediction * 100).toFixed(1)}%
                    </div>
                    <div className='text-sm text-gray-400'>Prediction Confidence</div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='p-4 bg-slate-900/50 rounded-lg'>
                    <h4 className='font-medium text-white mb-2'>Base Value</h4>
                    <div className='text-2xl font-bold text-gray-400'>
                      {(selectedPredictionData.localExplanation.baseValue * 100).toFixed(1)}%
                    </div>
                    <div className='text-xs text-gray-500'>Model's default prediction</div>
                  </div>

                  <div className='p-4 bg-slate-900/50 rounded-lg'>
                    <h4 className='font-medium text-white mb-2'>Feature Impact</h4>
                    <div className='text-2xl font-bold text-purple-400'>
                      +
                      {(
                        (selectedPredictionData.prediction -
                          selectedPredictionData.localExplanation.baseValue) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className='text-xs text-gray-500'>Total feature contribution</div>
                  </div>

                  <div className='p-4 bg-slate-900/50 rounded-lg'>
                    <h4 className='font-medium text-white mb-2'>Model Quality</h4>
                    <div className='text-2xl font-bold text-cyan-400'>
                      {selectedPredictionData.confidence.toFixed(1)}%
                    </div>
                    <div className='text-xs text-gray-500'>Prediction confidence</div>
                  </div>
                </div>
              </div>

              {/* Feature Contributions */}
              <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div>
                    <h3 className='text-xl font-bold text-white'>Feature Contributions</h3>
                    <p className='text-gray-400 text-sm'>
                      SHAP values showing feature impact on prediction
                    </p>
                  </div>
                  <Eye className='w-5 h-5 text-purple-400' />
                </div>

                <div className='space-y-4'>
                  {selectedPredictionData.shapValues
                    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
                    .map((shap, index) => (
                      <motion.div
                        key={shap.feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className='border border-slate-700/50 rounded-lg overflow-hidden'
                      >
                        <div
                          className='p-4 cursor-pointer hover:bg-slate-800/30 transition-colors'
                          onClick={() => toggleFeatureExpansion(shap.feature)}
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center space-x-3'>
                              {expandedFeatures.has(shap.feature) ? (
                                <ChevronDown className='w-4 h-4 text-gray-400' />
                              ) : (
                                <ChevronRight className='w-4 h-4 text-gray-400' />
                              )}
                              <div>
                                <h4 className='font-bold text-white'>{shap.feature}</h4>
                                <div className='text-xs text-gray-400'>{shap.category}</div>
                              </div>
                            </div>

                            <div className='flex items-center space-x-4'>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getImpactColor(shap.impact)}`}
                              >
                                {shap.impact.toUpperCase()}
                              </span>
                              <div className='text-right'>
                                <div
                                  className={`text-lg font-bold ${
                                    shap.contribution > 0 ? 'text-green-400' : 'text-red-400'
                                  }`}
                                >
                                  {shap.contribution > 0 ? '+' : ''}
                                  {(shap.contribution * 100).toFixed(1)}%
                                </div>
                                <div className='text-xs text-gray-400'>contribution</div>
                              </div>
                            </div>
                          </div>

                          {/* Contribution Bar */}
                          <div className='relative w-full bg-slate-700 rounded-full h-3 mb-2'>
                            <div className='absolute left-1/2 w-px h-3 bg-gray-400'></div>
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${getContributionBarColor(shap.contribution)}`}
                              style={{
                                width: `${Math.abs(shap.contribution) * 50}%`,
                                marginLeft:
                                  shap.contribution > 0
                                    ? '50%'
                                    : `${50 - Math.abs(shap.contribution) * 50}%`,
                              }}
                            />
                          </div>

                          <div className='flex justify-between text-xs text-gray-400'>
                            <span>Value: {shap.value}</span>
                            <span>Base: {shap.baseValue}</span>
                            <span>Importance: {(shap.importance * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        {expandedFeatures.has(shap.feature) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className='border-t border-slate-700/50 p-4 bg-slate-900/30'
                          >
                            <p className='text-gray-300 text-sm mb-3'>{shap.description}</p>
                            <div className='grid grid-cols-2 gap-4 text-sm'>
                              <div>
                                <span className='text-gray-400'>Current Value:</span>
                                <span className='text-white ml-2'>{shap.value}</span>
                              </div>
                              <div>
                                <span className='text-gray-400'>Expected Value:</span>
                                <span className='text-white ml-2'>{shap.baseValue}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {viewMode === 'global' && modelInterpretability.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Global Feature Importance</h3>
              <p className='text-gray-400 text-sm'>Average feature impact across all predictions</p>
            </div>
            <BarChart3 className='w-5 h-5 text-green-400' />
          </div>

          <div className='space-y-4'>
            {modelInterpretability[0].globalImportance.map((feature, index) => (
              <motion.div
                key={feature.feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'
              >
                <div>
                  <div className='font-medium text-white'>{feature.feature}</div>
                  <div className='text-xs text-gray-400'>{feature.category}</div>
                </div>

                <div className='flex items-center space-x-4'>
                  <div className='w-32 bg-slate-700 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-purple-400 to-cyan-400 h-2 rounded-full transition-all duration-500'
                      style={{ width: `${(feature.importance / 0.2) * 100}%` }}
                    />
                  </div>
                  <span className='text-white font-medium w-12 text-right'>
                    {(feature.importance * 100).toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {viewMode === 'interactions' && modelInterpretability.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Feature Interactions</h3>
              <p className='text-gray-400 text-sm'>How features interact with each other</p>
            </div>
            <Cpu className='w-5 h-5 text-purple-400' />
          </div>

          <div className='space-y-4'>
            {modelInterpretability[0].featureInteractions.map((interaction, index) => (
              <motion.div
                key={`${interaction.feature1}-${interaction.feature2}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className='p-4 bg-slate-900/50 rounded-lg border border-slate-700/50'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h4 className='font-medium text-white'>
                      {interaction.feature1} ↔ {interaction.feature2}
                    </h4>
                    <p className='text-sm text-gray-300 mt-1'>{interaction.explanation}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getInteractionStrength(interaction.strength)}`}
                  >
                    {interaction.strength.toUpperCase()}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-400'>Interaction Value</div>
                  <div
                    className={`text-lg font-bold ${
                      interaction.interactionValue > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {interaction.interactionValue > 0 ? '+' : ''}
                    {(interaction.interactionValue * 100).toFixed(2)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </Layout>
  );
};

export default SHAPAnalysis;
