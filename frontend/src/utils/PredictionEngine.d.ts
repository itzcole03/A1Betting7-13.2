import { AnalysisPlugin } from './AnalysisFramework.ts';
import { PipelineStage } from './DataPipeline.ts';
import { FeatureComponent } from './FeatureComposition.ts';
import { StrategyComponent, StrategyResult } from './StrategyComposition.ts';
export interface PredictionData {
  value: number;
  timestamp: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}
export interface MarketData {
  price: number;
  volume: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
export interface CorrelationData {
  factor: string;
  correlation: number;
  significance: number;
  metadata?: Record<string, unknown>;
}
export interface SentimentData {
  score: number;
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
export interface DataSource<T = unknown> {
  id: string;
  fetch(): Promise<T>;
}
export interface DataSink<T = unknown> {
  id: string;
  write(data: T): Promise<void>;
  flush?(): Promise<void>;
}
export interface PipelineMetrics {
  confidence: number;
  throughput: number;
  averageLatency: number;
}
export interface PredictionEngineConfig {
  features: FeatureComponent<unknown, unknown>[];
  dataSources: DataSource[];
  pipelineStages: PipelineStage<unknown, unknown>[];
  dataSinks: DataSink[];
  analysisPlugins: AnalysisPlugin<unknown, unknown>[];
  strategies: StrategyComponent<unknown, unknown>[];
  options: {
    enableCaching?: boolean;
    cacheTtl?: number;
    processingInterval?: number;
    retryAttempts?: number;
    batchSize?: number;
    debugMode?: boolean;
  };
}
export interface PredictionContext {
  playerId: string;
  metric: string;
  timestamp: number;
  marketState: string;
  correlationFactors: string[];
}
export interface PredictionResult {
  id: string;
  timestamp: number;
  data: Record<string, unknown>;
  confidence: number;
  analysis: AnalysisResult[];
  strategy: StrategyResult<Record<string, unknown>>;
  metadata: {
    duration: number;
    features: string[];
    dataSources: string[];
    analysisPlugins: string[];
    strategy: string;
  };
}
export interface PredictionData {
  id: string;
  timestamp: number;
  context: PredictionContext;
  value: number;
  confidence: number;
  analysis: AnalysisResult;
}
export interface PredictionFeedback {
  predictionId: string;
  actualValue: number;
  timestamp: number;
  metadata: Record<string, string | number | boolean | object>;
}
export interface ModelWeights {
  historical: number;
  market: number;
  sentiment: number;
  correlation: number;
}
export interface Strategy {
  id: string;
  name: string;
  description: string;
  confidence: number;
  analyze(data: IntegratedData): Promise<Decision>;
  validate(data: IntegratedData): boolean;
  getMetrics(): any;
}
export interface Decision {
  id: string;
  timestamp: number;
  confidence: number;
  recommendations: Recommendation[];
  analysis: AnalysisResult;
}
export interface Recommendation {
  id: string;
  type: 'OVER' | 'UNDER';
  confidence: number;
  reasoning: string[];
  supporting_data: {
    historical_data: PredictionData[];
    market_data: MarketData[];
    correlation_data: CorrelationData[];
  };
}
export interface AnalysisResult {
  meta_analysis: {
    data_quality: number;
    prediction_stability: number;
    market_efficiency: number;
    playerId: string;
    metric: string;
  };
  confidence_factors: {
    [key: string]: number;
  };
  risk_factors: {
    [key: string]: number;
  };
  risk_reasoning?: string[];
}
export interface IntegratedData {
  historical: PredictionData[];
  market: MarketData[];
  sentiment: SentimentData[];
  correlations: CorrelationData[];
  metadata: Record<string, string | number | boolean | object>;
}
export interface UnifiedDataStream<T> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  metadata: Record<string, string | number | boolean | object>;
}
export declare class PredictionEngine {
  private static instance;
  private readonly eventBus;
  private readonly performanceMonitor;
  private readonly featureRegistry;
  private readonly analysisRegistry;
  private readonly strategyRegistry;
  private readonly pipelines;
  private readonly config;
  private readonly analysisEngine;
  private readonly strategyEngine;
  private readonly configManager;
  private readonly strategies;
  private readonly predictions;
  private predictionMetrics;
  private feedbackLoop;
  private modelWeights;
  private readonly MAX_FEEDBACK_HISTORY;
  private readonly WEIGHT_UPDATE_INTERVAL;
  private constructor();
  static getInstance(): PredictionEngine;
  private initialize;
  private setupMonitoring;
  start(): Promise<void>;
  stop(): Promise<void>;
  predict(prop: any): Promise<PredictionData>;
  private determineMarketState;
  private identifyCorrelationFactors;
  private integrateData;
  private generatePredictions;
  private calculateWeightedValue;
  private combinePredictions;
  private setupEventListeners;
  private startWeightOptimization;
  registerStrategy(strategy: Strategy): void;
  getStrategies(): Map<string, Strategy>;
  getPredictions(): Map<string, PredictionData>;
  getModelWeights(): ModelWeights;
  private processFeedback;
  private updateMetrics;
  private calculateVariance;
  private optimizeWeights;
  private analyzeComponentPerformance;
  private calculateComponentScore;
  private getInitialWeights;
  private storePrediction;
  private calculateConfidence;
  private calculateHistoricalPrediction;
  private calculateSentimentPrediction;
  private calculateMarketPrediction;
  private calculateCorrelationPrediction;
  private combineWeightedPredictions;
  private updatePredictions;
  private handleDataUpdate;
  private handleStrategyFeedback;
  private handleModelFeedback;
}
