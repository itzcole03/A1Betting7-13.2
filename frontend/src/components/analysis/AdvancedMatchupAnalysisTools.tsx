import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Activity, ArrowLeftRight, Target, 
  Brain, Zap, Calculator, Database, LineChart, PieChart,
  Users, Trophy, Timer, Flame, Eye, Shield, AlertTriangle,
  ChevronDown, ChevronUp, Filter, Settings, Download,
  Calendar, Clock, MapPin, Cloud, ThermometerSun
} from 'lucide-react';

// Advanced statistical modeling interfaces
interface StatisticalModel {
  name: string;
  type: 'regression' | 'bayesian' | 'neural' | 'ensemble';
  accuracy: number;
  confidence: number;
  lastUpdated: Date;
  parameters: Record<string, any>;
}

interface AdvancedMatchupData {
  homeTeam: {
    name: string;
    abbreviation: string;
    record: string;
    stats: {
      offense: number;
      defense: number;
      pace: number;
      efficiency: number;
      homeAdvantage: number;
    };
    recentForm: number[];
    injuries: string[];
    trends: {
      l5: number;
      l10: number;
      home: number;
      vs_opponent: number;
    };
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    record: string;
    stats: {
      offense: number;
      defense: number;
      pace: number;
      efficiency: number;
      roadPerformance: number;
    };
    recentForm: number[];
    injuries: string[];
    trends: {
      l5: number;
      l10: number;
      away: number;
      vs_opponent: number;
    };
  };
  gameContext: {
    venue: string;
    date: Date;
    importance: number;
    restDays: {
      home: number;
      away: number;
    };
    weather: {
      condition: string;
      temperature: number;
      wind: number;
      humidity: number;
    };
    officials: string[];
  };
  historicalMatchups: {
    totalGames: number;
    homeTeamWins: number;
    awayTeamWins: number;
    averageTotal: number;
    trends: {
      last5: number[];
      last10: number[];
      venue: number[];
    };
  };
  predictionModels: StatisticalModel[];
  keyFactors: {
    name: string;
    impact: number;
    confidence: number;
    description: string;
  }[];
}

interface AnalysisType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  computationTime: number;
}

interface PredictiveInsight {
  category: string;
  metric: string;
  prediction: number;
  confidence: number;
  range: {
    min: number;
    max: number;
  };
  factors: string[];
  significance: number;
}

const AdvancedMatchupAnalysisTools: React.FC = () => {
  const [selectedMatchup, setSelectedMatchup] = useState<AdvancedMatchupData | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<string[]>(['regression', 'bayesian']);
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['pace', 'efficiency', 'defense']);
  const [timeframe, setTimeframe] = useState<'season' | 'l10' | 'l5' | 'custom'>('l10');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.75);

  // Available analysis types
  const analysisTypes: AnalysisType[] = [
    {
      id: 'regression',
      name: 'Linear Regression',
      description: 'Multi-variate linear regression analysis with feature selection',
      icon: LineChart,
      complexity: 'basic',
      computationTime: 150
    },
    {
      id: 'bayesian',
      name: 'Bayesian Analysis',
      description: 'Bayesian inference with prior distributions and uncertainty quantification',
      icon: Brain,
      complexity: 'advanced',
      computationTime: 800
    },
    {
      id: 'neural',
      name: 'Neural Network',
      description: 'Deep neural network with ensemble predictions',
      icon: Zap,
      complexity: 'expert',
      computationTime: 1200
    },
    {
      id: 'correlation',
      name: 'Correlation Matrix',
      description: 'Advanced correlation analysis with statistical significance testing',
      icon: Target,
      complexity: 'intermediate',
      computationTime: 300
    },
    {
      id: 'clustering',
      name: 'K-Means Clustering',
      description: 'Unsupervised clustering to identify similar matchup patterns',
      icon: Database,
      complexity: 'intermediate',
      computationTime: 450
    },
    {
      id: 'ensemble',
      name: 'Ensemble Modeling',
      description: 'Combined predictions from multiple machine learning models',
      icon: Users,
      complexity: 'expert',
      computationTime: 2000
    }
  ];

  // Generate realistic matchup data
  const generateMatchupData = useCallback((): AdvancedMatchupData => {
    return {
      homeTeam: {
        name: 'Los Angeles Dodgers',
        abbreviation: 'LAD',
        record: '98-64',
        stats: {
          offense: 85.2,
          defense: 78.9,
          pace: 102.3,
          efficiency: 82.1,
          homeAdvantage: 6.2
        },
        recentForm: [1, 1, 0, 1, 1, 0, 1, 1, 1, 0],
        injuries: ['Mookie Betts (Day-to-Day)'],
        trends: {
          l5: 4,
          l10: 7,
          home: 52,
          vs_opponent: 3
        }
      },
      awayTeam: {
        name: 'San Diego Padres',
        abbreviation: 'SD',
        record: '82-80',
        stats: {
          offense: 79.8,
          defense: 74.2,
          pace: 98.7,
          efficiency: 76.5,
          roadPerformance: 38
        },
        recentForm: [0, 1, 0, 0, 1, 1, 0, 1, 0, 1],
        injuries: ['Fernando Tatis Jr. (Shoulder)'],
        trends: {
          l5: 2,
          l10: 5,
          away: 38,
          vs_opponent: 2
        }
      },
      gameContext: {
        venue: 'Dodger Stadium',
        date: new Date(),
        importance: 8.5,
        restDays: {
          home: 1,
          away: 0
        },
        weather: {
          condition: 'Clear',
          temperature: 75,
          wind: 8,
          humidity: 45
        },
        officials: ['Joe West', 'Angel Hernandez']
      },
      historicalMatchups: {
        totalGames: 156,
        homeTeamWins: 89,
        awayTeamWins: 67,
        averageTotal: 8.2,
        trends: {
          last5: [1, 0, 1, 1, 0],
          last10: [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
          venue: [1, 1, 0, 1, 1]
        }
      },
      predictionModels: [
        {
          name: 'XGBoost Ensemble',
          type: 'ensemble',
          accuracy: 74.2,
          confidence: 0.82,
          lastUpdated: new Date(),
          parameters: { trees: 100, depth: 6, learning_rate: 0.1 }
        },
        {
          name: 'Bayesian Network',
          type: 'bayesian',
          accuracy: 71.8,
          confidence: 0.78,
          lastUpdated: new Date(),
          parameters: { prior_strength: 0.5, iterations: 1000 }
        },
        {
          name: 'Neural Network',
          type: 'neural',
          accuracy: 76.9,
          confidence: 0.85,
          lastUpdated: new Date(),
          parameters: { layers: [128, 64, 32], dropout: 0.3, epochs: 200 }
        }
      ],
      keyFactors: [
        {
          name: 'Home Field Advantage',
          impact: 0.68,
          confidence: 0.92,
          description: 'Dodgers have strong home performance this season'
        },
        {
          name: 'Recent Form Differential',
          impact: 0.45,
          confidence: 0.78,
          description: 'LAD trending better in last 10 games'
        },
        {
          name: 'Injury Impact',
          impact: -0.23,
          confidence: 0.65,
          description: 'Key player injuries affecting both teams'
        },
        {
          name: 'Weather Conditions',
          impact: 0.12,
          confidence: 0.55,
          description: 'Favorable conditions for offense'
        }
      ]
    };
  }, []);

  // Generate predictive insights
  const generatePredictiveInsights = useCallback((matchup: AdvancedMatchupData): PredictiveInsight[] => {
    return [
      {
        category: 'Game Outcome',
        metric: 'Win Probability',
        prediction: 0.652,
        confidence: 0.84,
        range: { min: 0.58, max: 0.72 },
        factors: ['Home advantage', 'Recent form', 'Head-to-head'],
        significance: 0.91
      },
      {
        category: 'Scoring',
        metric: 'Total Runs',
        prediction: 8.7,
        confidence: 0.76,
        range: { min: 7.1, max: 10.3 },
        factors: ['Team pace', 'Weather', 'Pitching matchup'],
        significance: 0.78
      },
      {
        category: 'Performance',
        metric: 'Runs Differential',
        prediction: 2.3,
        confidence: 0.71,
        range: { min: 0.8, max: 3.8 },
        factors: ['Offensive efficiency', 'Defensive rating'],
        significance: 0.85
      },
      {
        category: 'Advanced',
        metric: 'Game Flow Index',
        prediction: 1.45,
        confidence: 0.82,
        range: { min: 1.12, max: 1.78 },
        factors: ['Pace differential', 'Momentum indicators'],
        significance: 0.73
      }
    ];
  }, []);

  // Perform statistical analysis
  const performAnalysis = useCallback(async (analysisType: string) => {
    if (!selectedMatchup) return;

    setIsAnalyzing(true);
    
    // Simulate computation time
    const analysis = analysisTypes.find(a => a.id === analysisType);
    if (analysis) {
      await new Promise(resolve => setTimeout(resolve, analysis.computationTime));
    }

    // Generate mock results based on analysis type
    let results;
    switch (analysisType) {
      case 'regression':
        results = {
          r_squared: 0.743,
          coefficients: {
            home_advantage: 0.68,
            recent_form: 0.45,
            rest_days: 0.23,
            injuries: -0.31
          },
          p_values: {
            home_advantage: 0.002,
            recent_form: 0.015,
            rest_days: 0.087,
            injuries: 0.041
          },
          confidence_intervals: {
            home_advantage: [0.52, 0.84],
            recent_form: [0.28, 0.62]
          }
        };
        break;
      case 'bayesian':
        results = {
          posterior_mean: 0.652,
          credible_interval: [0.58, 0.72],
          bayes_factor: 3.2,
          posterior_probability: 0.84,
          prior_influence: 0.23,
          evidence: 'Strong support for home team advantage'
        };
        break;
      case 'neural':
        results = {
          prediction_accuracy: 0.769,
          feature_importance: {
            recent_form: 0.284,
            home_advantage: 0.231,
            team_strength: 0.195,
            injuries: 0.156,
            weather: 0.134
          },
          model_confidence: 0.85,
          prediction_variance: 0.12
        };
        break;
      case 'correlation':
        results = {
          correlation_matrix: {
            offense_defense: -0.23,
            pace_efficiency: 0.67,
            home_wins: 0.54,
            rest_performance: 0.31
          },
          significance_levels: {
            offense_defense: 0.045,
            pace_efficiency: 0.001,
            home_wins: 0.008,
            rest_performance: 0.092
          }
        };
        break;
      case 'clustering':
        results = {
          clusters: 4,
          silhouette_score: 0.72,
          cluster_assignments: {
            similar_matchups: ['LAD vs SF', 'LAD vs COL', 'SD vs SF'],
            outcomes: [0.68, 0.71, 0.59]
          },
          cluster_characteristics: {
            high_scoring: { games: 23, avg_total: 9.8 },
            low_scoring: { games: 18, avg_total: 6.2 }
          }
        };
        break;
      case 'ensemble':
        results = {
          weighted_prediction: 0.672,
          model_weights: {
            xgboost: 0.35,
            neural_net: 0.28,
            bayesian: 0.22,
            linear: 0.15
          },
          ensemble_confidence: 0.89,
          variance_reduction: 0.34,
          individual_predictions: {
            xgboost: 0.68,
            neural_net: 0.71,
            bayesian: 0.65,
            linear: 0.63
          }
        };
        break;
      default:
        results = {};
    }

    setAnalysisResults(prev => ({
      ...prev,
      [analysisType]: results
    }));

    setIsAnalyzing(false);
  }, [selectedMatchup, analysisTypes]);

  // Initialize with sample data
  useEffect(() => {
    const matchup = generateMatchupData();
    setSelectedMatchup(matchup);
  }, [generateMatchupData]);

  // Auto-run selected analyses
  useEffect(() => {
    if (selectedMatchup && activeAnalysis.length > 0) {
      activeAnalysis.forEach(analysisType => {
        if (!analysisResults[analysisType]) {
          performAnalysis(analysisType);
        }
      });
    }
  }, [selectedMatchup, activeAnalysis, analysisResults, performAnalysis]);

  const predictiveInsights = useMemo(() => {
    return selectedMatchup ? generatePredictiveInsights(selectedMatchup) : [];
  }, [selectedMatchup, generatePredictiveInsights]);

  const StatisticalVisualization: React.FC<{ type: string; data: any }> = ({ type, data }) => {
    switch (type) {
      case 'regression':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <LineChart className="w-4 h-4 mr-2" />
                Regression Coefficients
              </h4>
              <div className="space-y-2">
                {Object.entries(data.coefficients || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 capitalize">{key.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-mono ${(value as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(value as number).toFixed(3)}
                      </span>
                      <span className="text-xs text-gray-500">
                        (p={data.p_values?.[key]?.toFixed(3) || 'N/A'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">R-squared:</span>
                  <span className="font-semibold text-blue-400">{data.r_squared?.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'bayesian':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Bayesian Inference
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Posterior Mean:</span>
                  <span className="font-semibold text-purple-400">{data.posterior_mean?.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Credible Interval:</span>
                  <span className="font-mono text-sm">
                    [{data.credible_interval?.[0]?.toFixed(2)}, {data.credible_interval?.[1]?.toFixed(2)}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bayes Factor:</span>
                  <span className="font-semibold text-green-400">{data.bayes_factor?.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Posterior Probability:</span>
                  <span className="font-semibold text-blue-400">{(data.posterior_probability * 100)?.toFixed(1)}%</span>
                </div>
              </div>
              {data.evidence && (
                <div className="mt-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-200">{data.evidence}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'neural':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Neural Network Analysis
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Prediction Accuracy:</span>
                  <span className="font-semibold text-green-400">{(data.prediction_accuracy * 100)?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Model Confidence:</span>
                  <span className="font-semibold text-purple-400">{(data.model_confidence * 100)?.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Feature Importance</h5>
                <div className="space-y-2">
                  {Object.entries(data.feature_importance || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400 capitalize w-24">{key.replace('_', ' ')}</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${(value as number) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-300 w-12">{((value as number) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'ensemble':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Ensemble Modeling
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Weighted Prediction:</span>
                  <span className="font-semibold text-green-400">{data.weighted_prediction?.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ensemble Confidence:</span>
                  <span className="font-semibold text-purple-400">{(data.ensemble_confidence * 100)?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Variance Reduction:</span>
                  <span className="font-semibold text-blue-400">{(data.variance_reduction * 100)?.toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Model Weights</h5>
                  <div className="space-y-1">
                    {Object.entries(data.model_weights || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                        <span className="font-mono">{((value as number) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Individual Predictions</h5>
                  <div className="space-y-1">
                    {Object.entries(data.individual_predictions || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                        <span className="font-mono">{(value as number).toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400">Analysis results will appear here</p>
          </div>
        );
    }
  };

  if (!selectedMatchup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Calculator className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading Analysis Tools</h2>
          <p className="text-gray-400">Preparing advanced statistical models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-purple-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Advanced Matchup Analysis
                </h1>
              </div>
              
              {isAnalyzing && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Computing...</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Matchup Overview */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold">{selectedMatchup.awayTeam.abbreviation}</span>
                </div>
                <div className="text-sm text-gray-400">{selectedMatchup.awayTeam.record}</div>
              </div>
              
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="w-6 h-6 text-purple-400" />
                <span className="text-sm text-gray-400">vs</span>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold">{selectedMatchup.homeTeam.abbreviation}</span>
                </div>
                <div className="text-sm text-gray-400">{selectedMatchup.homeTeam.record}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{selectedMatchup.gameContext.venue}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{selectedMatchup.gameContext.date.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <ThermometerSun className="w-4 h-4" />
                <span className="text-sm">{selectedMatchup.gameContext.weather.temperature}°F, {selectedMatchup.gameContext.weather.condition}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-400">
                {((selectedMatchup.historicalMatchups.homeTeamWins / selectedMatchup.historicalMatchups.totalGames) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-400">Home Win Rate</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-400">
                {selectedMatchup.historicalMatchups.averageTotal.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">Avg Total</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-400">
                {selectedMatchup.gameContext.importance.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">Game Importance</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-yellow-400">
                {selectedMatchup.historicalMatchups.totalGames}
              </div>
              <div className="text-sm text-gray-400">Total H2H</div>
            </div>
          </div>
        </div>

        {/* Analysis Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Analysis Selection */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Statistical Analysis Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisTypes.map((analysis) => {
                  const Icon = analysis.icon;
                  const isActive = activeAnalysis.includes(analysis.id);
                  const hasResults = analysisResults[analysis.id];
                  
                  return (
                    <motion.div
                      key={analysis.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-purple-600/20 border-purple-500 shadow-lg' 
                          : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => {
                        if (isActive) {
                          setActiveAnalysis(prev => prev.filter(id => id !== analysis.id));
                        } else {
                          setActiveAnalysis(prev => [...prev, analysis.id]);
                          if (!hasResults) {
                            performAnalysis(analysis.id);
                          }
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
                        <div className="flex items-center space-x-1">
                          {hasResults && <CheckCircle className="w-4 h-4 text-green-400" />}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            analysis.complexity === 'basic' ? 'bg-green-600/20 text-green-400' :
                            analysis.complexity === 'intermediate' ? 'bg-yellow-600/20 text-yellow-400' :
                            analysis.complexity === 'advanced' ? 'bg-orange-600/20 text-orange-400' :
                            'bg-red-600/20 text-red-400'
                          }`}>
                            {analysis.complexity}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{analysis.name}</h4>
                      <p className="text-xs text-gray-400 mb-2">{analysis.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">~{analysis.computationTime}ms</span>
                        {isActive && <span className="text-purple-400">Active</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Key Factors */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Key Factors</h3>
              <div className="space-y-3">
                {selectedMatchup.keyFactors.map((factor, index) => (
                  <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{factor.name}</span>
                      <span className={`text-sm font-semibold ${
                        factor.impact >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {factor.impact >= 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1 mb-2">
                      <div 
                        className={`h-1 rounded-full ${
                          factor.impact >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.abs(factor.impact) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{factor.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">Confidence</span>
                      <span className="text-xs font-mono">{(factor.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {activeAnalysis.map((analysisType) => (
            <motion.div
              key={analysisType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {analysisTypes.find(a => a.id === analysisType)?.name}
                  </h3>
                  {analysisResults[analysisType] && (
                    <div className="flex items-center space-x-1 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Complete</span>
                    </div>
                  )}
                </div>
                
                {analysisResults[analysisType] ? (
                  <StatisticalVisualization 
                    type={analysisType} 
                    data={analysisResults[analysisType]} 
                  />
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-gray-400">Computing analysis...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Predictive Insights */}
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-400" />
            Predictive Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {predictiveInsights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-700/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{insight.category}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    insight.significance >= 0.8 ? 'bg-green-600/20 text-green-400' :
                    insight.significance >= 0.6 ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    {(insight.significance * 100).toFixed(0)}%
                  </span>
                </div>
                
                <h4 className="font-semibold mb-1">{insight.metric}</h4>
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {typeof insight.prediction === 'number' ? 
                    (insight.prediction < 1 ? (insight.prediction * 100).toFixed(1) + '%' : insight.prediction.toFixed(1)) :
                    insight.prediction
                  }
                </div>
                
                <div className="text-xs text-gray-400 mb-2">
                  Range: {insight.range.min.toFixed(1)} - {insight.range.max.toFixed(1)}
                </div>
                
                <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
                  <div 
                    className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: `${insight.confidence * 100}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-400">
                  Confidence: {(insight.confidence * 100).toFixed(0)}%
                </div>
                
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Key Factors:</div>
                  <div className="flex flex-wrap gap-1">
                    {insight.factors.slice(0, 2).map((factor, idx) => (
                      <span key={idx} className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMatchupAnalysisTools;
