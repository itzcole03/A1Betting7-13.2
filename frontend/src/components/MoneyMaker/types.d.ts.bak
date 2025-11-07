/**
 * Ultimate Money Maker - TypeScript Definitions
 * 
 * Comprehensive type definitions for the Ultimate Money Maker component
 * and its quantum AI-powered betting engine.
 */

// ==================== CORE TYPES ====================

export interface BettingOpportunity {
  // Basic opportunity identification
  id: string;
  game: string;
  market: string;
  pick: string;
  odds: number;
  
  // Confidence and prediction metrics
  confidence: number;                 // Overall confidence (0-100)
  expectedROI: number;               // Expected return on investment
  kellyStake: number;               // Optimal bet size via Kelly Criterion
  expectedProfit: number;           // Expected profit amount
  risk: 'low' | 'medium' | 'high';  // Risk classification
  
  // AI and neural analysis
  neural: string;                   // Neural network insights
  reason: string;                   // Human-readable reasoning
  
  // Quantum AI enhancements
  quantumConfidence: number;        // Quantum-enhanced confidence
  superpositionStates: SuperpositionState[];
  entanglementFactor: number;       // Market correlation factor
  quantumAdvantage: number;         // Quantum processing advantage
  probabilityAmplitude: number;     // Quantum probability amplitude
  quantumInterference: number;      // Interference pattern strength
  
  // Model ensemble data
  modelEnsemble: ModelEnsembleData;
  
  // Risk and market metrics
  marketEfficiency: number;         // Market efficiency score
  riskMetrics: RiskMetrics;
  realTimeFactors: RealTimeFactors;
}

export interface SuperpositionState {
  outcome: string;                  // Possible outcome description
  probability: number;              // Classical probability (0-1)
  amplitude: number;                // Quantum amplitude
  phase: number;                    // Quantum phase (0-2π)
  coherence: number;               // State coherence (0-1)
}

export interface ModelEnsembleData {
  xgboost: ModelPrediction;
  neuralNet: ModelPrediction;
  lstm: ModelPrediction;
  randomForest: ModelPrediction;
  quantumModel: ModelPrediction;
  ensemble: ModelPrediction;
  
  // Ensemble metrics
  consensus: number;                // Model agreement level (0-100)
  disagreement: number;            // Model disagreement level (0-100)
  reliability: number;             // Overall ensemble reliability
  
  // Performance tracking
  historicalAccuracy: number;
  recentPerformance: number[];
  lastRetrain: string;
}

export interface ModelPrediction {
  prediction: number;              // Numerical prediction
  confidence: number;              // Model confidence (0-100)
  accuracy: number;               // Historical accuracy (0-100)
  weight: number;                 // Model weight in ensemble (0-1)
  lastUpdate: string;             // Last update timestamp
  features: string[];             // Key features used
  uncertainty: number;            // Prediction uncertainty
}

export interface RiskMetrics {
  // Volatility measures
  sharpeRatio: number;           // Risk-adjusted return
  volatility: number;            // Return volatility
  skewness: number;             // Return distribution skewness
  kurtosis: number;             // Return distribution kurtosis
  
  // Drawdown measures
  maxDrawdown: number;          // Maximum historical drawdown
  currentDrawdown: number;      // Current drawdown
  drawdownDuration: number;     // Days in drawdown
  
  // Risk measures
  valueAtRisk: number;          // 95% VaR
  conditionalValueAtRisk: number; // Expected shortfall
  betaToMarket: number;         // Market correlation
  
  // Portfolio measures
  diversificationRatio: number;  // Portfolio diversification
  concentration: number;         // Position concentration
  leverage: number;             // Effective leverage
}

export interface RealTimeFactors {
  steamMoves: SteamMove[];
  sharpMoney: SharpMoneyIndicator;
  lineMovement: LineMovement;
  marketSentiment: MarketSentiment;
  lastUpdate: string;
}

// ==================== CONFIGURATION ====================

export interface MoneyMakerConfig {
  // Investment parameters
  investment: number;              // Total investment amount
  maxBetSize: number;             // Maximum single bet size
  minBetSize: number;             // Minimum single bet size
  
  // Strategy settings
  strategy: StrategyType;
  confidence: number;             // Minimum confidence threshold
  riskLevel: RiskLevel;
  
  // Portfolio management
  portfolio: number;              // Portfolio allocation percentage
  diversification: boolean;       // Enable portfolio diversification
  maxExposure: number;           // Maximum market exposure
  
  // Market filters
  sports: SportType[];           // Enabled sports
  leagues: string[];             // Target leagues
  timeFrame: TimeFrame;          // Analysis time frame
  
  // Odds filters
  maxOdds: number;               // Maximum acceptable odds
  minOdds: number;               // Minimum acceptable odds
  
  // Advanced filters
  playerTypes: PlayerType[];     // Player type preferences
  weatherFilter: boolean;        // Enable weather filtering
  injuryFilter: boolean;         // Enable injury filtering
  sharpMoneyOnly: boolean;       // Only sharp money bets
  
  // Risk management
  stopLoss: number;              // Stop loss percentage
  takeProfit: number;            // Take profit percentage
  maxDrawdown: number;           // Maximum acceptable drawdown
  
  // Quantum settings
  quantumEnabled: boolean;       // Enable quantum processing
  coherenceThreshold: number;    // Minimum coherence level
  entanglementDepth: number;     // Entanglement analysis depth
}

// ==================== COMPONENT PROPS ====================

export interface UltimateMoneyMakerProps {
  /** Initial configuration for the money maker */
  initialConfig?: MoneyMakerConfig;
  
  /** Callback when opportunities are updated */
  onOpportunitiesUpdate?: (opportunities: BettingOpportunity[]) => void;
  
  /** Callback when configuration changes */
  onConfigChange?: (config: MoneyMakerConfig) => void;
  
  /** Callback when quantum engine state changes */
  onQuantumStateChange?: (state: QuantumEngineStatus) => void;
  
  /** Callback for model ensemble updates */
  onModelEnsembleUpdate?: (ensemble: ModelEnsembleData) => void;
  
  /** Callback for risk metric updates */
  onRiskMetricsUpdate?: (metrics: RiskMetrics) => void;
  
  /** Whether to enable quantum processing */
  enableQuantumEngine?: boolean;
  
  /** Real-time data refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Maximum number of opportunities to display */
  maxOpportunities?: number;
  
  /** Theme configuration */
  theme?: ThemeConfig;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Whether component is in demo mode */
  demoMode?: boolean;
  
  /** Enable debug logging */
  debugMode?: boolean;
  
  /** Performance monitoring configuration */
  performanceConfig?: PerformanceConfig;
}

export interface EnhancedUltimateMoneyMakerProps extends UltimateMoneyMakerProps {
  /** Quantum engine specific configuration */
  quantumEngineConfig?: QuantumEngineConfig;
  
  /** Model ensemble specific configuration */
  modelEnsembleConfig?: ModelEnsembleConfig;
  
  /** Risk management specific configuration */
  riskManagementConfig?: RiskManagementConfig;
  
  /** Advanced analytics configuration */
  analyticsConfig?: AnalyticsConfig;
}

// ==================== QUANTUM AI TYPES ====================

export interface QuantumEngineStatus {
  isActive: boolean;
  coherenceLevel: number;           // Quantum coherence (0-100)
  entanglementStrength: number;     // System entanglement strength
  interferencePattern: number;      // Quantum interference level
  superpositionCount: number;       // Active superposition states
  quantumAdvantage: number;         // Computational advantage
  processingState: QuantumProcessingState;
  lastUpdate: string;
  performance: QuantumPerformance;
}

export interface QuantumEngineConfig {
  coherenceThreshold: number;       // Minimum coherence level (0-1)
  entanglementDepth: number;        // Entanglement analysis depth
  maxSuperpositions: number;        // Maximum superposition states
  interferenceAnalysis: boolean;    // Enable interference analysis
  quantumCircuitDepth: number;      // Quantum circuit depth
  decoherenceRate: number;         // Decoherence rate tolerance
}

export interface QuantumPerformance {
  accuracy: number;                // Quantum model accuracy
  speed: number;                   // Processing speed factor
  efficiency: number;              // Computational efficiency
  quantumSpeedup: number;         // Speedup vs classical
}

export interface EntanglementPair {
  opportunity1: string;
  opportunity2: string;
  correlation: number;           // Correlation strength (-1 to 1)
  coherenceTime: number;         // How long correlation persists
  confidence: number;            // Confidence in entanglement
}

export interface InterferencePattern {
  constructive: number;          // Constructive interference strength
  destructive: number;           // Destructive interference strength
  netEffect: number;            // Net interference effect
  opportunities: string[];       // Affected opportunities
}

// ==================== ML MODEL TYPES ====================

export interface ModelEnsembleConfig {
  enabledModels: ModelType[];
  rebalanceInterval: number;        // Rebalancing interval (ms)
  weightingStrategy: WeightingStrategy;
  performanceWindow: number;       // Performance evaluation window
  minModelWeight: number;          // Minimum model weight
  maxModelWeight: number;          // Maximum model weight
}

export interface ModelConfig {
  xgboost?: XGBoostConfig;
  neuralNet?: NeuralNetConfig;
  lstm?: LSTMConfig;
  randomForest?: RandomForestConfig;
  quantumModel?: QuantumModelConfig;
}

export interface XGBoostConfig {
  maxDepth: number;
  nEstimators: number;
  learningRate: number;
  subsample: number;
  colsampleBytree: number;
}

export interface NeuralNetConfig {
  layers: number[];
  activation: ActivationFunction;
  optimizer: OptimizerType;
  learningRate: number;
  epochs: number;
  batchSize: number;
  dropout: number;
}

export interface LSTMConfig {
  units: number;
  timeSteps: number;
  layers: number;
  dropout: number;
  recurrentDropout: number;
}

// ==================== RISK MANAGEMENT TYPES ====================

export interface RiskManagementConfig {
  kellyFraction: number;           // Kelly fraction multiplier
  maxDrawdown: number;             // Maximum acceptable drawdown
  maxConcentration: number;        // Maximum position concentration
  stopLossThreshold: number;       // Stop loss threshold
  takeProfitThreshold: number;     // Take profit threshold
  riskBudget: number;             // Risk budget allocation
  correlationLimit: number;       // Maximum correlation limit
}

export interface PortfolioMetrics {
  totalValue: number;
  totalRisk: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  averageReturn: number;
  volatility: number;
  diversificationRatio: number;
}

export interface RiskAlert {
  id: string;
  type: RiskAlertType;
  severity: AlertSeverity;
  message: string;
  recommendations: string[];
  threshold: number;
  currentValue: number;
  timestamp: string;
}

// ==================== HELPER TYPES ====================

export type StrategyType = 'quantum' | 'neural' | 'aggressive' | 'conservative';
export type RiskLevel = 'low' | 'medium' | 'high';
export type SportType = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'MLS' | 'NCAA';
export type TimeFrame = '1h' | '6h' | '24h' | '7d' | '30d';
export type PlayerType = 'stars' | 'role_players' | 'rookies' | 'veterans';
export type QuantumProcessingState = 'idle' | 'analyzing' | 'optimizing' | 'complete' | 'error';
export type ModelType = 'xgboost' | 'neuralNet' | 'lstm' | 'randomForest' | 'quantumModel';
export type WeightingStrategy = 'performance' | 'recency' | 'accuracy' | 'sharpe' | 'ensemble';
export type ActivationFunction = 'relu' | 'sigmoid' | 'tanh' | 'softmax';
export type OptimizerType = 'adam' | 'sgd' | 'rmsprop' | 'adagrad';
export type RiskAlertType = 'drawdown' | 'concentration' | 'volatility' | 'correlation' | 'exposure';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// ==================== MARKET DATA TYPES ====================

export interface SteamMove {
  id: string;
  market: string;
  oldLine: number;
  newLine: number;
  movement: number;
  confidence: number;
  timestamp: string;
}

export interface SharpMoneyIndicator {
  volume: number;
  direction: 'buy' | 'sell';
  confidence: number;
  source: string;
  timestamp: string;
}

export interface LineMovement {
  openingLine: number;
  currentLine: number;
  movement: number;
  direction: 'up' | 'down' | 'stable';
  velocity: number;
  timestamp: string;
}

export interface MarketSentiment {
  bullish: number;              // Bullish sentiment (0-100)
  bearish: number;              // Bearish sentiment (0-100)
  neutral: number;              // Neutral sentiment (0-100)
  volume: number;               // Sentiment volume
  confidence: number;           // Sentiment confidence
}

// ==================== THEME & UI TYPES ====================

export interface ThemeConfig {
  colorScheme: 'dark' | 'light' | 'auto';
  primaryColor: string;
  accentColor: string;
  quantumColor: string;
  aiColor: string;
  riskColors: {
    low: string;
    medium: string;
    high: string;
  };
  animations: boolean;
  transitions: boolean;
}

export interface PerformanceConfig {
  enableVirtualization: boolean;
  enableMemoryOptimization: boolean;
  maxCacheSize: number;
  renderOptimization: boolean;
  debugPerformance: boolean;
}

export interface AnalyticsConfig {
  trackUserInteractions: boolean;
  trackPerformance: boolean;
  trackErrors: boolean;
  anonymizeData: boolean;
  reportingInterval: number;
}

// ==================== HOOK RETURN TYPES ====================

export interface UseQuantumEngineReturn {
  status: QuantumEngineStatus;
  superpositionStates: SuperpositionState[];
  entanglements: EntanglementPair[];
  interference: InterferencePattern;
  runAnalysis: (opportunities: BettingOpportunity[]) => Promise<void>;
  reset: () => void;
  isProcessing: boolean;
  error: string | null;
}

export interface UseModelEnsembleReturn {
  ensemble: ModelEnsembleData;
  predictions: Record<string, ModelPrediction>;
  performance: Record<string, number>;
  isTraining: boolean;
  lastUpdate: string;
  retrain: () => Promise<void>;
  updateWeights: (weights: Record<string, number>) => void;
  error: string | null;
}

export interface UseRiskManagementReturn {
  metrics: RiskMetrics;
  portfolio: PortfolioMetrics;
  alerts: RiskAlert[];
  recommendations: string[];
  calculateKellySize: (opportunity: BettingOpportunity) => number;
  assessRisk: (opportunity: BettingOpportunity) => RiskLevel;
  isWithinLimits: (opportunity: BettingOpportunity) => boolean;
  error: string | null;
}

// ==================== API RESPONSE TYPES ====================

export interface MoneyMakerApiResponse<T> {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    timestamp: string;
    version: string;
    processingTime: number;
  };
}

export interface OpportunityFetchResponse extends MoneyMakerApiResponse<BettingOpportunity[]> {
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

// ==================== EVENT TYPES ====================

export interface MoneyMakerEventMap {
  'opportunities:updated': BettingOpportunity[];
  'quantum:status_changed': QuantumEngineStatus;
  'models:retrained': ModelEnsembleData;
  'risk:alert': RiskAlert;
  'config:changed': MoneyMakerConfig;
  'error:occurred': Error;
  'performance:metrics': PerformanceMetrics;
}

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
  userInteractions: number;
}

// ==================== COMPONENT EXPORTS ====================

declare const UltimateMoneyMaker: React.FC<UltimateMoneyMakerProps>;
declare const EnhancedUltimateMoneyMaker: React.FC<EnhancedUltimateMoneyMakerProps>;

export { UltimateMoneyMaker, EnhancedUltimateMoneyMaker };
export default UltimateMoneyMaker;
