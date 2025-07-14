type ExtendedIntegratedData = {
  projections?: Record<string, unknown>;
  odds?: Record<string, unknown>;
  sentiment?: any[];
  injuries?: Record<string, unknown>;
  trends?: Record<string, unknown>;
  timestamp?: number;
};
// import { ProjectionAnalysis } from '@/analyzers/ProjectionAnalyzer.ts';
// import { Decision, IntegratedData, Recommendation, Strategy } from '@/core/PredictionEngine.ts';
export interface ProjectionPlugin {
  statType: string;
  evaluate: (projection: any, config: any) => any[];
}
interface StrategyConfig {
  minConfidence: number;
  minEdge: number;
  maxRisk: number;
  useHistoricalData: boolean;
  useAdvancedStats: boolean;
}
export declare class ProjectionBettingStrategy /* implements any */ {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  confidence: number;
  private readonly eventBus;
  private readonly performanceMonitor;
  private readonly featureManager;
  private readonly config;
  private metrics;
  private edgeCache;
  private stabilityCache;
  private confidenceCache;
  private plugins;
  constructor(config: any, plugins?: any[]);
  validate(data: any): boolean;
  getMetrics(): void;
  private registerDefaultPlugins;
  analyze(data: any): Promise<any>;
  private generateRiskReasoning;
}
