import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  BarChart3,
  Activity,
  Star,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Shield,
  Eye,
  Calculator,
  Gauge,
  Award,
  Clock,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  PieChart,
} from 'lucide-react';

interface ConfidenceMetrics {
  overall: number;
  dataQuality: number;
  modelAccuracy: number;
  historicalPerformance: number;
  situationalFactors: number;
  marketConsensus: number;
}

interface EVCalculation {
  expectedValue: number;
  trueProbability: number;
  impliedProbability: number;
  edge: number;
  roi: number;
  kellyPercentage: number;
  riskLevel: 'low' | 'medium' | 'high';
  breakdown: EVBreakdown;
}

interface EVBreakdown {
  playerForm: number;
  matchupAdvantage: number;
  situationalFactors: number;
  injuryRisk: number;
  marketInefficiency: number;
  weatherImpact?: number;
  venueAdvantage: number;
}

interface PredictionInsight {
  id: string;
  category: string;
  impact: number;
  confidence: number;
  description: string;
  weight: number;
  icon: React.ComponentType<any>;
  color: string;
}

interface AIReasoningNode {
  factor: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  details: string;
  data_points: string[];
}

const EnhancedConfidenceScoring: React.FC<{
  playerId?: string;
  propType?: string;
  line?: number;
  odds?: number;
  onConfidenceUpdate?: (confidence: number, ev: number) => void;
}> = ({ 
  playerId = 'tatum-1', 
  propType = 'points', 
  line = 27.5, 
  odds = -110,
  onConfidenceUpdate 
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [aiAnalysisStage, setAiAnalysisStage] = useState<'loading' | 'complete' | 'error'>('complete');
  
  // Mock data based on roadmap specifications
  const confidenceMetrics: ConfidenceMetrics = {
    overall: 87.4,
    dataQuality: 94.2,
    modelAccuracy: 82.1,
    historicalPerformance: 89.7,
    situationalFactors: 91.3,
    marketConsensus: 76.8,
  };

  const evCalculation: EVCalculation = {
    expectedValue: 1.15,
    trueProbability: 0.642,
    impliedProbability: 0.524,
    edge: 11.8,
    roi: 15.3,
    kellyPercentage: 2.8,
    riskLevel: 'medium',
    breakdown: {
      playerForm: 0.152,
      matchupAdvantage: 0.089,
      situationalFactors: 0.067,
      injuryRisk: -0.023,
      marketInefficiency: 0.098,
      venueAdvantage: 0.034,
    },
  };

  const aiReasoningNodes: AIReasoningNode[] = [
    {
      factor: 'Recent Form Trend',
      weight: 0.28,
      impact: 'positive',
      confidence: 0.92,
      details: 'Strong upward trend: 31.2 PPG over L5 vs 27.8 season average (+12.2%)',
      data_points: ['L5: 31.2 PPG', 'L10: 29.5 PPG', 'Season: 27.8 PPG', 'Consistency: 85%'],
    },
    {
      factor: 'Matchup Advantage',
      weight: 0.22,
      impact: 'positive',
      confidence: 0.84,
      details: 'Opponent allows 29.3 PPG to SFs (7th worst) with weak perimeter defense',
      data_points: ['Opp allows 29.3 PPG to SF', 'Def rating: 112.4', 'Pace: 102.1', 'B2B: No'],
    },
    {
      factor: 'Venue & Situation',
      weight: 0.18,
      impact: 'positive',
      confidence: 0.76,
      details: 'Home court advantage (+2.1 PPG) with high-scoring pace expected',
      data_points: ['Home: +2.1 PPG', 'Rest days: 1', 'Game pace: 103.7', 'Prime time: Yes'],
    },
    {
      factor: 'Market Inefficiency',
      weight: 0.15,
      impact: 'positive',
      confidence: 0.89,
      details: 'Line value: Books undervaluing recent form improvement',
      data_points: ['Fair line: 29.1', 'Market line: 27.5', 'Sharp money: 62%', 'Public: 38%'],
    },
    {
      factor: 'Injury Risk',
      weight: 0.12,
      impact: 'neutral',
      confidence: 0.98,
      details: 'No current injury concerns, full practice participation',
      data_points: ['Injury report: Clean', 'Practice: Full', 'Load mgmt: Low risk', 'Minutes: Projected 36'],
    },
    {
      factor: 'Historical Performance',
      weight: 0.05,
      impact: 'positive',
      confidence: 0.71,
      details: 'Strong historical record vs this opponent: 78% over rate',
      data_points: ['H2H record: 7-2 over', 'Career avg vs opp: 29.8', 'Playoff factor: N/A'],
    },
  ];

  const predictionInsights: PredictionInsight[] = [
    {
      id: '1',
      category: 'Form Analysis',
      impact: 0.28,
      confidence: 92,
      description: 'Recent scoring surge indicates peak performance window',
      weight: 0.28,
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      id: '2',
      category: 'Matchup Edge',
      impact: 0.22,
      confidence: 84,
      description: 'Favorable defensive matchup with exploitable weaknesses',
      weight: 0.22,
      icon: Target,
      color: 'text-blue-400',
    },
    {
      id: '3',
      category: 'Market Value',
      impact: 0.15,
      confidence: 89,
      description: 'Line offers significant value based on true probability',
      weight: 0.15,
      icon: DollarSign,
      color: 'text-yellow-400',
    },
    {
      id: '4',
      category: 'Situational',
      impact: 0.18,
      confidence: 76,
      description: 'Game environment factors favor high scoring performance',
      weight: 0.18,
      icon: Activity,
      color: 'text-purple-400',
    },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  useEffect(() => {
    onConfidenceUpdate?.(confidenceMetrics.overall, evCalculation.expectedValue);
  }, [confidenceMetrics.overall, evCalculation.expectedValue, onConfidenceUpdate]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-cyan-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">AI Confidence Analysis</h2>
              <p className="text-gray-400">Advanced EV calculation with explainable reasoning</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-cyan-400">{confidenceMetrics.overall}%</div>
            <div className="text-sm text-gray-400">Overall Confidence</div>
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div className="text-lg font-bold text-green-400">+{evCalculation.edge}%</div>
            </div>
            <div className="text-sm text-gray-300">Expected Edge</div>
            <div className="text-xs text-gray-400">vs Market</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              <div className="text-lg font-bold text-blue-400">{(evCalculation.trueProbability * 100).toFixed(1)}%</div>
            </div>
            <div className="text-sm text-gray-300">True Probability</div>
            <div className="text-xs text-gray-400">AI Calculated</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div className="text-lg font-bold text-purple-400">+{evCalculation.roi}%</div>
            </div>
            <div className="text-sm text-gray-300">Expected ROI</div>
            <div className="text-xs text-gray-400">Per Unit</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Gauge className="w-5 h-5 text-yellow-400" />
              <div className={`text-lg font-bold ${getRiskColor(evCalculation.riskLevel)}`}>
                {evCalculation.kellyPercentage}%
              </div>
            </div>
            <div className="text-sm text-gray-300">Kelly %</div>
            <div className="text-xs text-gray-400">Optimal Size</div>
          </div>
        </div>
      </div>

      {/* AI Reasoning Breakdown */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">AI Reasoning Breakdown</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Lightbulb className="w-4 h-4" />
            <span>Explainable AI (SHAP Values)</span>
          </div>
        </div>

        <div className="space-y-4">
          {aiReasoningNodes.map((node, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === node.factor ? null : node.factor)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getImpactIcon(node.impact)}
                  <div>
                    <div className="font-medium text-white">{node.factor}</div>
                    <div className="text-sm text-gray-400">{node.details}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">{(node.weight * 100).toFixed(0)}%</div>
                    <div className="text-xs text-gray-400">Weight</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-cyan-400">{(node.confidence * 100).toFixed(0)}%</div>
                    <div className="text-xs text-gray-400">Confidence</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedSection === node.factor ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>

              <AnimatePresence>
                {expandedSection === node.factor && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-slate-600"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {node.data_points.map((point, i) => (
                        <div key={i} className="bg-slate-800/50 rounded p-2">
                          <div className="text-xs text-gray-300">{point}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Confidence Metrics Detailed */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-white mb-6">Confidence Components</h3>
        
        <div className="space-y-4">
          {Object.entries(confidenceMetrics).filter(([key]) => key !== 'overall').map(([key, value]) => {
            const labels = {
              dataQuality: 'Data Quality',
              modelAccuracy: 'Model Accuracy',
              historicalPerformance: 'Historical Performance',
              situationalFactors: 'Situational Factors',
              marketConsensus: 'Market Consensus',
            };
            
            const icons = {
              dataQuality: Shield,
              modelAccuracy: Brain,
              historicalPerformance: BarChart3,
              situationalFactors: Activity,
              marketConsensus: PieChart,
            };

            const Icon = icons[key as keyof typeof icons];

            return (
              <div key={key} className="flex items-center space-x-4">
                <Icon className="w-5 h-5 text-cyan-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium">{labels[key as keyof typeof labels]}</span>
                    <span className="text-cyan-400 font-bold">{value.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prediction Insights */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-white mb-6">Key Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictionInsights.map((insight) => (
            <div key={insight.id} className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <insight.icon className={`w-5 h-5 ${insight.color} mt-1`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{insight.category}</span>
                    <span className="text-sm text-gray-400">{insight.confidence}%</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{insight.description}</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-600 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full bg-gradient-to-r ${
                          insight.color.includes('green') ? 'from-green-400 to-green-500' :
                          insight.color.includes('blue') ? 'from-blue-400 to-blue-500' :
                          insight.color.includes('yellow') ? 'from-yellow-400 to-yellow-500' :
                          'from-purple-400 to-purple-500'
                        }`}
                        style={{ width: `${insight.impact * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{(insight.impact * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedConfidenceScoring;
