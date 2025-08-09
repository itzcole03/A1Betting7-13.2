import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Star,
  Zap,
  Shield,
  Clock,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Flame,
  Eye,
  Brain,
  Calculator,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  ArrowRight,
  ArrowLeftRight,
  Plus,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Database,
  Cpu,
  Gauge,
  LineChart,
  PieChart,
  Microscope,
  Layers,
} from 'lucide-react';

// Enhanced interfaces with advanced statistical modeling
interface PlayerComparison {
  playerA: PlayerMatchupData;
  playerB: PlayerMatchupData;
  directMatchups: DirectMatchupHistory[];
  contextualFactors: ContextualFactor[];
  recommendations: MatchupRecommendation[];
  overallAdvantage: 'playerA' | 'playerB' | 'even';
  confidenceScore: number;
  // Advanced statistical features
  statisticalModels: StatisticalModels;
  correlationMatrix: CorrelationData[];
  predictiveInsights: PredictiveInsight[];
  regressionAnalysis: RegressionResult[];
  probabilityDistributions: ProbabilityDistribution[];
  performanceMetrics: PerformanceMetrics;
  marketEfficiency: MarketEfficiencyData;
}

interface PlayerMatchupData {
  id: string;
  name: string;
  team: string;
  position: string;
  image?: string;
  stats: MatchupStats;
  trends: TrendAnalysis;
  advantages: string[];
  weaknesses: string[];
  form: FormMetrics;
  situationalPerformance: SituationalStats;
  // Enhanced statistical data
  advancedStats: AdvancedStatistics;
  bayesianModel: BayesianModelData;
  performanceDistribution: PerformanceDistribution;
  clutchMetrics: ClutchPerformance;
  fatigueFactor: FatigueAnalysis;
  injuryRisk: InjuryRiskAssessment;
}

interface AdvancedStatistics {
  zScores: Record<string, number>;
  percentileRanks: Record<string, number>;
  standardDeviations: Record<string, number>;
  confidenceIntervals: Record<string, [number, number]>;
  regressionCoefficients: Record<string, number>;
  correlationStrengths: Record<string, number>;
  seasonalTrends: SeasonalTrend[];
  varianceAnalysis: VarianceData;
}

interface BayesianModelData {
  priorBelief: number;
  posteriorProbability: number;
  likelihoodRatio: number;
  credibleInterval: [number, number];
  modelUncertainty: number;
  updateStrength: number;
}

interface StatisticalModels {
  linearRegression: ModelResult;
  logisticRegression: ModelResult;
  randomForest: ModelResult;
  neuralNetwork: ModelResult;
  ensembleModel: ModelResult;
  timeSeriesModel: ModelResult;
}

interface ModelResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  rmse: number;
  mape: number;
  predictions: number[];
  featureImportance: FeatureImportance[];
  residualAnalysis: ResidualData;
}

interface FeatureImportance {
  feature: string;
  importance: number;
  significance: number;
  pValue: number;
}

interface CorrelationData {
  variable1: string;
  variable2: string;
  correlation: number;
  pValue: number;
  significance: 'high' | 'medium' | 'low' | 'none';
}

interface PredictiveInsight {
  category: string;
  insight: string;
  confidence: number;
  impact: number;
  timeHorizon: string;
  statisticalBasis: string;
}

interface RegressionResult {
  dependent: string;
  independent: string[];
  rSquared: number;
  adjustedRSquared: number;
  coefficients: number[];
  pValues: number[];
  standardErrors: number[];
  confidence: number;
}

interface ProbabilityDistribution {
  metric: string;
  distribution: 'normal' | 'poisson' | 'binomial' | 'gamma';
  parameters: Record<string, number>;
  quantiles: Record<string, number>;
  expectedValue: number;
  variance: number;
  skewness: number;
  kurtosis: number;
}

interface PerformanceMetrics {
  sharpeRatio: number;
  informationRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  kelly: number;
  volatility: number;
}

interface MarketEfficiencyData {
  efficiency: number;
  arbitrageOpportunities: number;
  priceDiscrepancies: PriceDiscrepancy[];
  marketSentiment: MarketSentiment;
  liquidityMetrics: LiquidityData;
  volatilityRegime: VolatilityRegime;
}

interface PriceDiscrepancy {
  source1: string;
  source2: string;
  discrepancy: number;
  significance: number;
  duration: number;
}

interface MarketSentiment {
  bullish: number;
  bearish: number;
  neutral: number;
  momentum: number;
  contrarian: number;
}

interface LiquidityData {
  bidAskSpread: number;
  marketDepth: number;
  orderFlowImbalance: number;
  impactCost: number;
}

interface VolatilityRegime {
  current: 'low' | 'medium' | 'high';
  persistence: number;
  clustering: number;
  meanReversion: number;
}

// Additional interfaces for comprehensive analysis
interface MatchupStats {
  season: Record<string, number>;
  vsPosition: Record<string, number>;
  vsTeam: Record<string, number>;
  recent: Record<string, number>;
  clutch: Record<string, number>;
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  momentum: number;
  consistency: number;
  peakPerformance: number;
  volatility: number;
}

interface DirectMatchupHistory {
  date: string;
  playerAStats: Record<string, number>;
  playerBStats: Record<string, number>;
  winner: 'playerA' | 'playerB';
  gameContext: GameContext;
  significance: number;
}

interface GameContext {
  venue: 'home' | 'away' | 'neutral';
  gameType: 'regular' | 'playoff' | 'tournament';
  restDays: number;
  injuries: string[];
  weather?: string;
}

interface ContextualFactor {
  factor: string;
  impact: number;
  favors: 'playerA' | 'playerB' | 'neutral';
  description: string;
  confidence: number;
}

interface MatchupRecommendation {
  market: string;
  player: 'playerA' | 'playerB';
  recommendation: 'over' | 'under' | 'first_to' | 'most';
  line?: number;
  confidence: number;
  reasoning: string[];
  edge: number;
}

interface FormMetrics {
  current: number;
  peak: number;
  consistency: number;
  trend: 'improving' | 'declining' | 'stable';
  hotStreak: boolean;
}

interface SituationalStats {
  home: Record<string, number>;
  away: Record<string, number>;
  primetime: Record<string, number>;
  backToBack: Record<string, number>;
  rest: Record<string, number>;
  clutch: Record<string, number>;
}

interface PerformanceDistribution {
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  outliers: number[];
  distribution: number[];
}

interface ClutchPerformance {
  clutchTime: number;
  pressureSituations: number;
  gameWinners: number;
  clutchRating: number;
  consistency: number;
}

interface FatigueAnalysis {
  currentLoad: number;
  weeklyLoad: number;
  monthlyLoad: number;
  fatigueIndex: number;
  recoveryTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface InjuryRiskAssessment {
  currentRisk: number;
  historicalInjuries: number;
  bodyLoad: number;
  biomechanics: number;
  riskFactors: string[];
  preventionScore: number;
}

interface SeasonalTrend {
  period: string;
  performance: number;
  consistency: number;
  significance: number;
}

interface VarianceData {
  withinSubject: number;
  betweenSubject: number;
  totalVariance: number;
  explainedVariance: number;
}

interface ResidualData {
  residuals: number[];
  normality: number;
  heteroscedasticity: number;
  autocorrelation: number;
  outliers: number[];
}

const AdvancedMatchupAnalysisTools: React.FC = () => {
  const [selectedPlayerA, setSelectedPlayerA] = useState<string>('tatum-1');
  const [selectedPlayerB, setSelectedPlayerB] = useState<string>('durant-1');
  const [analysisType, setAnalysisType] = useState<'head2head' | 'statistical' | 'situational' | 'predictive' | 'bayesian' | 'regression'>('statistical');
  const [timeframe, setTimeframe] = useState<'season' | 'l10' | 'l5' | 'career'>('season');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [modelComplexity, setModelComplexity] = useState<'simple' | 'intermediate' | 'advanced'>('advanced');

  // Mock player database
  const playerDatabase = [
    { id: 'tatum-1', name: 'Jayson Tatum', team: 'BOS', position: 'SF', image: '🏀' },
    { id: 'durant-1', name: 'Kevin Durant', team: 'PHX', position: 'PF', image: '🏀' },
    { id: 'lebron-1', name: 'LeBron James', team: 'LAL', position: 'SF', image: '🏀' },
    { id: 'curry-1', name: 'Stephen Curry', team: 'GSW', position: 'PG', image: '🏀' },
    { id: 'giannis-1', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', image: '🏀' },
  ];

  // Enhanced analysis types with statistical models
  const analysisTypes = [
    { id: 'head2head', label: 'Head-to-Head', icon: ArrowLeftRight },
    { id: 'statistical', label: 'Statistical', icon: BarChart3 },
    { id: 'situational', label: 'Situational', icon: Clock },
    { id: 'predictive', label: 'Predictive', icon: Brain },
    { id: 'bayesian', label: 'Bayesian', icon: Layers },
    { id: 'regression', label: 'Regression', icon: LineChart },
  ];

  const timeframes = [
    { id: 'season', label: 'Season' },
    { id: 'l10', label: 'Last 10' },
    { id: 'l5', label: 'Last 5' },
    { id: 'career', label: 'Career' },
  ];

  // Enhanced mock analysis with advanced statistical modeling
  const mockAnalysis: PlayerComparison = {
    playerA: {
      id: 'tatum-1',
      name: 'Jayson Tatum',
      team: 'Boston Celtics',
      position: 'SF',
      image: '🏀',
      stats: {
        season: { points: 27.8, rebounds: 8.4, assists: 4.9, fg_pct: 0.468, threes: 3.1 },
        vsPosition: { points: 29.2, rebounds: 8.9, assists: 5.1, fg_pct: 0.485, threes: 3.4 },
        vsTeam: { points: 32.1, rebounds: 9.8, assists: 5.7, fg_pct: 0.512, threes: 4.1 },
        recent: { points: 31.2, rebounds: 9.1, assists: 5.4, fg_pct: 0.492, threes: 3.8 },
        clutch: { points: 6.8, fg_pct: 0.445, usage: 0.328 },
      },
      trends: {
        direction: 'up',
        momentum: 0.78,
        consistency: 0.82,
        peakPerformance: 0.91,
        volatility: 0.24,
      },
      advantages: [
        'Shooting efficiency vs SF (48.5% vs 45.2% avg)',
        'Rebounding advantage (8.9 vs 7.1 avg)',
        'Improved 3PT shooting (3.4 vs 2.8 avg)',
        'Strong recent form (+3.4 PPG over L10)',
      ],
      weaknesses: [
        'Turnover prone vs elite defenders',
        'Defensive rating drops in high-pace games',
        'Free throw rate below position average',
      ],
      form: {
        current: 0.89,
        peak: 0.94,
        consistency: 0.82,
        trend: 'improving',
        hotStreak: true,
      },
      situationalPerformance: {
        home: { points: 29.1, rebounds: 8.9, assists: 5.2 },
        away: { points: 26.5, rebounds: 7.9, assists: 4.6 },
        primetime: { points: 30.8, rebounds: 9.4, assists: 5.8 },
        backToBack: { points: 25.2, rebounds: 7.8, assists: 4.2 },
        rest: { points: 28.9, rebounds: 8.7, assists: 5.1 },
        clutch: { points: 6.8, fg_pct: 0.445 },
      },
      // Enhanced statistical features
      advancedStats: {
        zScores: { points: 1.47, rebounds: 0.89, assists: 0.23, fg_pct: 1.12 },
        percentileRanks: { points: 92.3, rebounds: 81.7, assists: 59.2, fg_pct: 86.4 },
        standardDeviations: { points: 4.8, rebounds: 2.1, assists: 1.6, fg_pct: 0.052 },
        confidenceIntervals: {
          points: [26.2, 29.4],
          rebounds: [7.8, 9.0],
          assists: [4.3, 5.5],
          fg_pct: [0.451, 0.485],
        },
        regressionCoefficients: { minutes: 0.42, usage: 0.78, pace: 0.33 },
        correlationStrengths: { pace: 0.67, usage: 0.84, rest: -0.41 },
        seasonalTrends: [
          { period: 'October', performance: 85.2, consistency: 78.9, significance: 0.032 },
          { period: 'November', performance: 91.7, consistency: 82.1, significance: 0.018 },
          { period: 'December', performance: 94.3, consistency: 87.4, significance: 0.012 },
        ],
        varianceAnalysis: {
          withinSubject: 12.4,
          betweenSubject: 28.7,
          totalVariance: 41.1,
          explainedVariance: 69.8,
        },
      },
      bayesianModel: {
        priorBelief: 0.72,
        posteriorProbability: 0.84,
        likelihoodRatio: 2.31,
        credibleInterval: [0.78, 0.90],
        modelUncertainty: 0.15,
        updateStrength: 0.67,
      },
      performanceDistribution: {
        q1: 24.2,
        median: 27.8,
        q3: 31.4,
        iqr: 7.2,
        outliers: [18.3, 41.7],
        distribution: [22, 25, 28, 31, 34, 29, 27, 30, 26, 33],
      },
      clutchMetrics: {
        clutchTime: 0.78,
        pressureSituations: 0.71,
        gameWinners: 0.89,
        clutchRating: 8.7,
        consistency: 0.84,
      },
      fatigueFactor: {
        currentLoad: 72.3,
        weeklyLoad: 156.7,
        monthlyLoad: 634.2,
        fatigueIndex: 0.23,
        recoveryTime: 18.4,
        riskLevel: 'low',
      },
      injuryRisk: {
        currentRisk: 0.12,
        historicalInjuries: 2,
        bodyLoad: 67.8,
        biomechanics: 0.89,
        riskFactors: ['Previous ankle injury', 'High minute load'],
        preventionScore: 8.3,
      },
    },
    playerB: {
      id: 'durant-1',
      name: 'Kevin Durant',
      team: 'Phoenix Suns',
      position: 'PF',
      image: '🏀',
      stats: {
        season: { points: 29.1, rebounds: 6.8, assists: 5.2, fg_pct: 0.523, threes: 2.3 },
        vsPosition: { points: 31.4, rebounds: 7.2, assists: 5.8, fg_pct: 0.538, threes: 2.6 },
        vsTeam: { points: 26.8, rebounds: 6.1, assists: 4.7, fg_pct: 0.498, threes: 2.1 },
        recent: { points: 27.9, rebounds: 6.5, assists: 5.0, fg_pct: 0.515, threes: 2.2 },
        clutch: { points: 7.2, fg_pct: 0.472, usage: 0.315 },
      },
      trends: {
        direction: 'stable',
        momentum: 0.65,
        consistency: 0.91,
        peakPerformance: 0.96,
        volatility: 0.18,
      },
      advantages: [
        'Elite shooting efficiency (52.3% FG)',
        'Clutch performance (47.2% in 4th quarter)',
        'Veteran experience in big games',
        'Height advantage in most matchups',
      ],
      weaknesses: [
        'Lower rebounding rate vs PFs',
        'Aging concerns with minute load',
        'Team chemistry adjustment period',
      ],
      form: {
        current: 0.84,
        peak: 0.96,
        consistency: 0.91,
        trend: 'stable',
        hotStreak: false,
      },
      situationalPerformance: {
        home: { points: 30.2, rebounds: 7.1, assists: 5.5 },
        away: { points: 28.0, rebounds: 6.5, assists: 4.9 },
        primetime: { points: 31.8, rebounds: 7.8, assists: 6.1 },
        backToBack: { points: 26.4, rebounds: 6.2, assists: 4.6 },
        rest: { points: 29.8, rebounds: 7.0, assists: 5.4 },
        clutch: { points: 7.2, fg_pct: 0.472 },
      },
      // Enhanced statistical features for Player B
      advancedStats: {
        zScores: { points: 1.89, rebounds: -0.23, assists: 0.67, fg_pct: 2.34 },
        percentileRanks: { points: 96.7, rebounds: 42.1, assists: 74.8, fg_pct: 98.2 },
        standardDeviations: { points: 3.9, rebounds: 1.8, assists: 1.4, fg_pct: 0.041 },
        confidenceIntervals: {
          points: [27.8, 30.4],
          rebounds: [6.2, 7.4],
          assists: [4.6, 5.8],
          fg_pct: [0.508, 0.538],
        },
        regressionCoefficients: { minutes: 0.38, usage: 0.82, pace: 0.29 },
        correlationStrengths: { pace: 0.59, usage: 0.91, rest: -0.38 },
        seasonalTrends: [
          { period: 'October', performance: 92.1, consistency: 89.3, significance: 0.024 },
          { period: 'November', performance: 94.8, consistency: 91.7, significance: 0.015 },
          { period: 'December', performance: 89.2, consistency: 87.9, significance: 0.029 },
        ],
        varianceAnalysis: {
          withinSubject: 8.7,
          betweenSubject: 19.3,
          totalVariance: 28.0,
          explainedVariance: 79.2,
        },
      },
      bayesianModel: {
        priorBelief: 0.81,
        posteriorProbability: 0.86,
        likelihoodRatio: 1.94,
        credibleInterval: [0.82, 0.90],
        modelUncertainty: 0.12,
        updateStrength: 0.54,
      },
      performanceDistribution: {
        q1: 26.8,
        median: 29.1,
        q3: 32.7,
        iqr: 5.9,
        outliers: [21.4, 38.9],
        distribution: [28, 31, 29, 27, 32, 30, 26, 33, 35, 29],
      },
      clutchMetrics: {
        clutchTime: 0.89,
        pressureSituations: 0.84,
        gameWinners: 0.92,
        clutchRating: 9.4,
        consistency: 0.91,
      },
      fatigueFactor: {
        currentLoad: 68.9,
        weeklyLoad: 142.3,
        monthlyLoad: 567.8,
        fatigueIndex: 0.31,
        recoveryTime: 22.1,
        riskLevel: 'medium',
      },
      injuryRisk: {
        currentRisk: 0.28,
        historicalInjuries: 4,
        bodyLoad: 73.4,
        biomechanics: 0.76,
        riskFactors: ['Age-related wear', 'Previous Achilles injury', 'High usage rate'],
        preventionScore: 7.1,
      },
    },
    directMatchups: [],
    contextualFactors: [],
    recommendations: [],
    overallAdvantage: 'playerA',
    confidenceScore: 78.4,
    // Advanced statistical modeling results
    statisticalModels: {
      linearRegression: {
        accuracy: 0.847,
        precision: 0.823,
        recall: 0.856,
        f1Score: 0.839,
        auc: 0.891,
        rmse: 3.47,
        mape: 12.8,
        predictions: [28.4, 29.1, 27.8, 30.2],
        featureImportance: [
          { feature: 'Recent Form', importance: 0.34, significance: 0.012, pValue: 0.003 },
          { feature: 'Matchup History', importance: 0.28, significance: 0.018, pValue: 0.007 },
          { feature: 'Home Court', importance: 0.19, significance: 0.024, pValue: 0.015 },
          { feature: 'Rest Days', importance: 0.19, significance: 0.031, pValue: 0.022 },
        ],
        residualAnalysis: {
          residuals: [-1.2, 0.8, -0.3, 1.7, -0.9],
          normality: 0.89,
          heteroscedasticity: 0.12,
          autocorrelation: 0.07,
          outliers: [4],
        },
      },
      logisticRegression: {
        accuracy: 0.789,
        precision: 0.812,
        recall: 0.756,
        f1Score: 0.783,
        auc: 0.834,
        rmse: 0.0,
        mape: 0.0,
        predictions: [0.78, 0.83, 0.71, 0.89],
        featureImportance: [
          { feature: 'Efficiency Rating', importance: 0.42, significance: 0.008, pValue: 0.002 },
          { feature: 'Usage Rate', importance: 0.31, significance: 0.014, pValue: 0.006 },
          { feature: 'Pace Factor', importance: 0.27, significance: 0.019, pValue: 0.011 },
        ],
        residualAnalysis: {
          residuals: [-0.08, 0.12, -0.04, 0.09, -0.05],
          normality: 0.92,
          heteroscedasticity: 0.08,
          autocorrelation: 0.03,
          outliers: [],
        },
      },
      randomForest: {
        accuracy: 0.923,
        precision: 0.914,
        recall: 0.931,
        f1Score: 0.922,
        auc: 0.967,
        rmse: 2.18,
        mape: 8.4,
        predictions: [29.2, 28.7, 30.1, 28.9],
        featureImportance: [
          { feature: 'Player Efficiency', importance: 0.31, significance: 0.001, pValue: 0.000 },
          { feature: 'Opponent Defense', importance: 0.26, significance: 0.003, pValue: 0.001 },
          { feature: 'Game Context', importance: 0.22, significance: 0.007, pValue: 0.002 },
          { feature: 'Fatigue Level', importance: 0.21, significance: 0.009, pValue: 0.004 },
        ],
        residualAnalysis: {
          residuals: [-0.7, 1.1, -0.2, 0.8, -0.4],
          normality: 0.94,
          heteroscedasticity: 0.06,
          autocorrelation: 0.02,
          outliers: [],
        },
      },
      neuralNetwork: {
        accuracy: 0.956,
        precision: 0.948,
        recall: 0.963,
        f1Score: 0.955,
        auc: 0.982,
        rmse: 1.73,
        mape: 6.2,
        predictions: [28.9, 29.3, 28.1, 29.7],
        featureImportance: [
          { feature: 'Composite Score', importance: 0.45, significance: 0.000, pValue: 0.000 },
          { feature: 'Momentum Index', importance: 0.28, significance: 0.001, pValue: 0.000 },
          { feature: 'Context Weighted', importance: 0.27, significance: 0.002, pValue: 0.001 },
        ],
        residualAnalysis: {
          residuals: [-0.4, 0.6, -0.1, 0.3, -0.2],
          normality: 0.97,
          heteroscedasticity: 0.03,
          autocorrelation: 0.01,
          outliers: [],
        },
      },
      ensembleModel: {
        accuracy: 0.971,
        precision: 0.965,
        recall: 0.976,
        f1Score: 0.970,
        auc: 0.989,
        rmse: 1.42,
        mape: 4.8,
        predictions: [29.1, 28.8, 29.4, 29.0],
        featureImportance: [
          { feature: 'Model Consensus', importance: 0.52, significance: 0.000, pValue: 0.000 },
          { feature: 'Uncertainty Weighted', importance: 0.31, significance: 0.000, pValue: 0.000 },
          { feature: 'Confidence Adjusted', importance: 0.17, significance: 0.001, pValue: 0.000 },
        ],
        residualAnalysis: {
          residuals: [-0.2, 0.3, -0.1, 0.2, -0.1],
          normality: 0.98,
          heteroscedasticity: 0.02,
          autocorrelation: 0.00,
          outliers: [],
        },
      },
      timeSeriesModel: {
        accuracy: 0.884,
        precision: 0.871,
        recall: 0.896,
        f1Score: 0.883,
        auc: 0.923,
        rmse: 2.89,
        mape: 9.7,
        predictions: [28.6, 29.2, 27.9, 30.1],
        featureImportance: [
          { feature: 'Trend Component', importance: 0.38, significance: 0.005, pValue: 0.001 },
          { feature: 'Seasonal Component', importance: 0.34, significance: 0.008, pValue: 0.003 },
          { feature: 'Cyclical Component', importance: 0.28, significance: 0.012, pValue: 0.006 },
        ],
        residualAnalysis: {
          residuals: [-1.1, 0.9, -0.5, 1.2, -0.8],
          normality: 0.86,
          heteroscedasticity: 0.14,
          autocorrelation: 0.09,
          outliers: [3],
        },
      },
    },
    correlationMatrix: [
      { variable1: 'Points', variable2: 'Usage Rate', correlation: 0.84, pValue: 0.001, significance: 'high' },
      { variable1: 'Efficiency', variable2: 'Win Probability', correlation: 0.67, pValue: 0.012, significance: 'medium' },
      { variable1: 'Fatigue', variable2: 'Performance', correlation: -0.42, pValue: 0.034, significance: 'medium' },
    ],
    predictiveInsights: [
      {
        category: 'Performance Trajectory',
        insight: 'Tatum showing 23% improvement trend in efficiency metrics over past 15 games',
        confidence: 0.89,
        impact: 0.67,
        timeHorizon: 'Next 5 games',
        statisticalBasis: 'Regression analysis with p-value < 0.01',
      },
      {
        category: 'Matchup Advantage',
        insight: 'Statistical edge in pace-adjusted metrics favors Tatum by 1.7 standard deviations',
        confidence: 0.92,
        impact: 0.74,
        timeHorizon: 'Head-to-head',
        statisticalBasis: 'Multi-factor ANOVA with 95% confidence interval',
      },
    ],
    regressionAnalysis: [
      {
        dependent: 'Points Scored',
        independent: ['Usage Rate', 'Efficiency', 'Pace', 'Rest Days'],
        rSquared: 0.847,
        adjustedRSquared: 0.831,
        coefficients: [0.42, 0.67, 0.23, -0.18],
        pValues: [0.003, 0.001, 0.024, 0.041],
        standardErrors: [0.12, 0.15, 0.09, 0.08],
        confidence: 0.95,
      },
    ],
    probabilityDistributions: [
      {
        metric: 'Points Scored',
        distribution: 'normal',
        parameters: { mean: 28.4, stdDev: 4.2 },
        quantiles: { p25: 25.6, p50: 28.4, p75: 31.2, p90: 33.8, p95: 35.7 },
        expectedValue: 28.4,
        variance: 17.64,
        skewness: 0.12,
        kurtosis: 2.87,
      },
    ],
    performanceMetrics: {
      sharpeRatio: 1.84,
      informationRatio: 1.23,
      calmarRatio: 2.17,
      maxDrawdown: 0.087,
      winRate: 0.687,
      avgWin: 3.42,
      avgLoss: -1.89,
      profitFactor: 1.97,
      kelly: 0.147,
      volatility: 0.234,
    },
    marketEfficiency: {
      efficiency: 0.742,
      arbitrageOpportunities: 3,
      priceDiscrepancies: [
        { source1: 'DraftKings', source2: 'FanDuel', discrepancy: 0.08, significance: 0.67, duration: 47 },
      ],
      marketSentiment: {
        bullish: 0.67,
        bearish: 0.21,
        neutral: 0.12,
        momentum: 0.78,
        contrarian: 0.34,
      },
      liquidityMetrics: {
        bidAskSpread: 0.023,
        marketDepth: 0.89,
        orderFlowImbalance: 0.12,
        impactCost: 0.034,
      },
      volatilityRegime: {
        current: 'medium',
        persistence: 0.67,
        clustering: 0.78,
        meanReversion: 0.42,
      },
    },
  };

  const runAdvancedAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsAnalyzing(false);
  };

  useEffect(() => {
    runAdvancedAnalysis();
  }, [selectedPlayerA, selectedPlayerB, analysisType, timeframe, modelComplexity]);

  const getModelAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.95) return 'text-green-400';
    if (accuracy >= 0.90) return 'text-yellow-400';
    if (accuracy >= 0.80) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSignificanceColor = (pValue: number) => {
    if (pValue <= 0.01) return 'text-green-400';
    if (pValue <= 0.05) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const renderStatisticalModels = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-4">Statistical Models Performance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(mockAnalysis.statisticalModels).map(([modelName, model]) => (
          <div key={modelName} className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white capitalize">{modelName.replace(/([A-Z])/g, ' $1')}</h4>
              <div className={`text-lg font-bold ${getModelAccuracyColor(model.accuracy)}`}>
                {(model.accuracy * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Precision:</span>
                <span className="text-white ml-2">{(model.precision * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-400">Recall:</span>
                <span className="text-white ml-2">{(model.recall * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-400">F1 Score:</span>
                <span className="text-white ml-2">{(model.f1Score * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-400">RMSE:</span>
                <span className="text-white ml-2">{model.rmse.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs text-gray-400 mb-2">Feature Importance</div>
              {model.featureImportance.slice(0, 3).map((feature, i) => (
                <div key={i} className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-300">{feature.feature}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-12 bg-slate-600 rounded-full h-1">
                      <div
                        className="bg-cyan-400 h-1 rounded-full"
                        style={{ width: `${feature.importance * 100}%` }}
                      />
                    </div>
                    <span className={getSignificanceColor(feature.pValue)}>
                      {(feature.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Model Ensemble Results */}
      <div className="bg-slate-800/50 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4">Ensemble Model Results</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {(mockAnalysis.statisticalModels.ensembleModel.accuracy * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">
              {mockAnalysis.statisticalModels.ensembleModel.rmse.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">RMSE</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {(mockAnalysis.statisticalModels.ensembleModel.auc * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">AUC</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {mockAnalysis.statisticalModels.ensembleModel.mape.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">MAPE</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBayesianAnalysis = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-4">Bayesian Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player A Bayesian */}
        <div className="bg-slate-700/30 rounded-lg p-6">
          <h4 className="font-bold text-green-400 mb-4">{mockAnalysis.playerA.name}</h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Prior Belief:</span>
              <span className="text-white">{(mockAnalysis.playerA.bayesianModel.priorBelief * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Posterior Probability:</span>
              <span className="text-green-400 font-bold">{(mockAnalysis.playerA.bayesianModel.posteriorProbability * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Likelihood Ratio:</span>
              <span className="text-white">{mockAnalysis.playerA.bayesianModel.likelihoodRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Model Uncertainty:</span>
              <span className="text-orange-400">{(mockAnalysis.playerA.bayesianModel.modelUncertainty * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Credible Interval (95%):</span>
              <div className="text-white mt-1">
                [{(mockAnalysis.playerA.bayesianModel.credibleInterval[0] * 100).toFixed(1)}%, {(mockAnalysis.playerA.bayesianModel.credibleInterval[1] * 100).toFixed(1)}%]
              </div>
            </div>
          </div>
        </div>

        {/* Player B Bayesian */}
        <div className="bg-slate-700/30 rounded-lg p-6">
          <h4 className="font-bold text-blue-400 mb-4">{mockAnalysis.playerB.name}</h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Prior Belief:</span>
              <span className="text-white">{(mockAnalysis.playerB.bayesianModel.priorBelief * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Posterior Probability:</span>
              <span className="text-blue-400 font-bold">{(mockAnalysis.playerB.bayesianModel.posteriorProbability * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Likelihood Ratio:</span>
              <span className="text-white">{mockAnalysis.playerB.bayesianModel.likelihoodRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Model Uncertainty:</span>
              <span className="text-orange-400">{(mockAnalysis.playerB.bayesianModel.modelUncertainty * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Credible Interval (95%):</span>
              <div className="text-white mt-1">
                [{(mockAnalysis.playerB.bayesianModel.credibleInterval[0] * 100).toFixed(1)}%, {(mockAnalysis.playerB.bayesianModel.credibleInterval[1] * 100).toFixed(1)}%]
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bayesian Update Visualization */}
      <div className="bg-slate-800/50 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4">Bayesian Update Process</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-lg font-bold text-gray-400">Prior</div>
            <div className="text-2xl font-bold text-white mt-2">72%</div>
            <div className="text-sm text-gray-400 mt-1">Initial belief</div>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-lg font-bold text-yellow-400">Evidence</div>
            <div className="text-2xl font-bold text-white mt-2">2.31x</div>
            <div className="text-sm text-gray-400 mt-1">Likelihood ratio</div>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-lg font-bold text-green-400">Posterior</div>
            <div className="text-2xl font-bold text-white mt-2">84%</div>
            <div className="text-sm text-gray-400 mt-1">Updated belief</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegressionAnalysis = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-4">Regression Analysis</h3>
      
      {mockAnalysis.regressionAnalysis.map((regression, index) => (
        <div key={index} className="bg-slate-700/30 rounded-lg p-6">
          <h4 className="font-bold text-white mb-4">
            Predicting {regression.dependent}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-400 mb-3">Model Summary</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">R-squared:</span>
                  <span className="text-green-400 font-bold">{regression.rSquared.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Adjusted R-squared:</span>
                  <span className="text-green-400 font-bold">{regression.adjustedRSquared.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence Level:</span>
                  <span className="text-white">{(regression.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-400 mb-3">Coefficients</h5>
              <div className="space-y-2">
                {regression.independent.map((variable, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">{variable}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white">{regression.coefficients[i].toFixed(3)}</span>
                      <span className={`text-xs ${getSignificanceColor(regression.pValues[i])}`}>
                        (p={regression.pValues[i].toFixed(3)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Regression Equation:</div>
            <div className="text-white font-mono text-sm">
              {regression.dependent} = {regression.coefficients[0].toFixed(3)} × {regression.independent[0]}
              {regression.coefficients.slice(1).map((coef, i) => 
                ` ${coef >= 0 ? '+' : ''} ${coef.toFixed(3)} × ${regression.independent[i + 1]}`
              ).join('')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCorrelationMatrix = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-4">Correlation Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAnalysis.correlationMatrix.map((correlation, index) => (
          <div key={index} className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-center mb-3">
              <div className="text-sm text-gray-400">{correlation.variable1} ↔ {correlation.variable2}</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                Math.abs(correlation.correlation) >= 0.7 ? 'text-green-400' :
                Math.abs(correlation.correlation) >= 0.5 ? 'text-yellow-400' :
                Math.abs(correlation.correlation) >= 0.3 ? 'text-orange-400' :
                'text-gray-400'
              }`}>
                {correlation.correlation.toFixed(3)}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Correlation Coefficient
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-3 text-xs">
              <span className="text-gray-400">p-value:</span>
              <span className={getSignificanceColor(correlation.pValue)}>
                {correlation.pValue.toFixed(4)}
              </span>
            </div>
            
            <div className="flex justify-between items-center mt-1 text-xs">
              <span className="text-gray-400">Significance:</span>
              <span className={`capitalize ${
                correlation.significance === 'high' ? 'text-green-400' :
                correlation.significance === 'medium' ? 'text-yellow-400' :
                correlation.significance === 'low' ? 'text-orange-400' :
                'text-gray-400'
              }`}>
                {correlation.significance}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPredictiveInsights = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-4">Predictive Insights</h3>
      
      <div className="space-y-4">
        {mockAnalysis.predictiveInsights.map((insight, index) => (
          <div key={index} className="bg-slate-700/30 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-bold text-white mb-2">{insight.category}</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{insight.insight}</p>
              </div>
              <div className="ml-4 text-right">
                <div className="text-lg font-bold text-cyan-400">
                  {(insight.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400">Confidence</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-sm text-gray-400">Impact</div>
                <div className="text-lg font-bold text-yellow-400">
                  {(insight.impact * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Time Horizon</div>
                <div className="text-sm text-white">{insight.timeHorizon}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Statistical Basis</div>
                <div className="text-xs text-gray-300">{insight.statisticalBasis}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Advanced Matchup Analysis Tools
          </h1>
          <p className="text-gray-400">Statistical modeling and machine learning for comprehensive player analysis</p>
        </div>

        {/* Enhanced Controls */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Player A Selection */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">Player A</label>
              <select
                value={selectedPlayerA}
                onChange={(e) => setSelectedPlayerA(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                {playerDatabase.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.team})
                  </option>
                ))}
              </select>
            </div>

            {/* Player B Selection */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">Player B</label>
              <select
                value={selectedPlayerB}
                onChange={(e) => setSelectedPlayerB(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                {playerDatabase.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.team})
                  </option>
                ))}
              </select>
            </div>

            {/* Analysis Type */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">Analysis Type</label>
              <div className="grid grid-cols-2 gap-2">
                {analysisTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setAnalysisType(type.id as any)}
                    className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      analysisType === type.id
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    <type.icon className="w-3 h-3" />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Complexity */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">Model Complexity</label>
              <select
                value={modelComplexity}
                onChange={(e) => setModelComplexity(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              >
                <option value="simple">Simple</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Confidence Level */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">
                Confidence Level: {confidenceLevel}%
              </label>
              <input
                type="range"
                min="90"
                max="99"
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={runAdvancedAnalysis}
              disabled={isAnalyzing}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Microscope className="w-4 h-4" />}
              <span>{isAnalyzing ? 'Analyzing...' : 'Run Advanced Analysis'}</span>
            </button>
            
            <div className="text-right">
              <div className="text-lg font-bold text-cyan-400">{mockAnalysis.confidenceScore.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Statistical Confidence</div>
            </div>
          </div>
        </div>

        {!isAnalyzing && (
          <div className="space-y-8">
            {/* Analysis Content Based on Type */}
            {analysisType === 'statistical' && renderStatisticalModels()}
            {analysisType === 'bayesian' && renderBayesianAnalysis()}
            {analysisType === 'regression' && renderRegressionAnalysis()}
            {analysisType === 'predictive' && renderPredictiveInsights()}
            
            {/* Always show correlation matrix for advanced analysis */}
            {analysisType !== 'head2head' && renderCorrelationMatrix()}

            {/* Performance Metrics Dashboard */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Performance Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {mockAnalysis.performanceMetrics.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Sharpe Ratio</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {(mockAnalysis.performanceMetrics.winRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {mockAnalysis.performanceMetrics.profitFactor.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Profit Factor</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {(mockAnalysis.performanceMetrics.kelly * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Kelly %</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {(mockAnalysis.performanceMetrics.volatility * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Volatility</div>
                </div>
              </div>
            </div>

            {/* Market Efficiency Analysis */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Market Efficiency Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-400 mb-3">Market Sentiment</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Bullish:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-green-400 h-2 rounded-full"
                            style={{ width: `${mockAnalysis.marketEfficiency.marketSentiment.bullish * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">
                          {(mockAnalysis.marketEfficiency.marketSentiment.bullish * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Bearish:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-red-400 h-2 rounded-full"
                            style={{ width: `${mockAnalysis.marketEfficiency.marketSentiment.bearish * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">
                          {(mockAnalysis.marketEfficiency.marketSentiment.bearish * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Neutral:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gray-400 h-2 rounded-full"
                            style={{ width: `${mockAnalysis.marketEfficiency.marketSentiment.neutral * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">
                          {(mockAnalysis.marketEfficiency.marketSentiment.neutral * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-400 mb-3">Liquidity Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Bid-Ask Spread:</span>
                      <span className="text-white">{(mockAnalysis.marketEfficiency.liquidityMetrics.bidAskSpread * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Market Depth:</span>
                      <span className="text-white">{(mockAnalysis.marketEfficiency.liquidityMetrics.marketDepth * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Impact Cost:</span>
                      <span className="text-white">{(mockAnalysis.marketEfficiency.liquidityMetrics.impactCost * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-12 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <Microscope className="absolute inset-0 w-8 h-8 text-purple-400 m-auto" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Advanced Statistical Analysis in Progress</h3>
            <p className="text-gray-400">
              Running {modelComplexity} models with {confidenceLevel}% confidence level...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedMatchupAnalysisTools;
