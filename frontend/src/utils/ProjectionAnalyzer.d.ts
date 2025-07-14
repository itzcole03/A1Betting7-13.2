// import { Analyzer } from '@/core/Analyzer.ts';
// import { DailyFantasyData } from '@/adapters/DailyFantasyAdapter.ts';
export interface ProjectionAnalysis {
  player: string;
  predictions: {
    points: PredictionMetrics;
    rebounds: PredictionMetrics;
    assists: PredictionMetrics;
    steals: PredictionMetrics;
    blocks: PredictionMetrics;
    threes: PredictionMetrics;
    minutes: PredictionMetrics;
  };
  confidence: number;
  metadata: {
    team: string;
    position: string;
    opponent: string;
    isHome: boolean;
  };
}
interface PredictionMetrics {
  predicted: number;
  confidence: number;
  range: {
    min: number;
    max: number;
  };
}
export declare class ProjectionAnalyzer /* implements Analyzer<any, any[]> */ {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly description: string;
  private readonly eventBus;
  private readonly performanceMonitor;
  private readonly confidenceThreshold;
  constructor(confidenceThreshold?: number);
  analyze(data: any): Promise<any[]>;
  confidence(data: any): Promise<number>;
  private analyzePlayerProjection;
  private calculateBaseConfidence;
  private calculateMetrics;
  private calculateVariance;
  private getStatTypeConfidence;
  private isValidProjection;
  validate(data: any): boolean;
  getMetrics(): {
    accuracy: number;
    latency: number;
    errorRate: number;
  };
}
