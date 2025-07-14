import {
  ExplainabilityMap,
  PerformanceMetrics,
  RiskProfile,
  TrendDelta,
} from '@/types/analytics.ts';
import { BaseService } from './BaseService.ts';
import { UnifiedServiceRegistry } from './UnifiedServiceRegistry.ts';
export interface RecentActivity {
  id: string;
  type: 'bet' | 'prediction' | 'opportunity';
  description: string;
  amount?: number;
  odds?: number;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
}
export declare class UnifiedAnalyticsService extends BaseService {
  private stateService;
  private bettingService;
  private predictionService;
  private errorService;
  constructor(registry: UnifiedServiceRegistry);
  getPerformanceMetricsApi(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<PerformanceMetrics>;
  getTrendDelta(
    eventId: string,
    marketId: string,
    selectionId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<TrendDelta>;
  getRiskProfile(eventId: string, marketId: string, selectionId: string): Promise<RiskProfile>;
  getExplainabilityMap(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<ExplainabilityMap[0]>;
  getModelMetadata(eventId: string, marketId: string, selectionId: string): Promise<ModelMetadata>;
  getRecentActivityApi(
    eventId: string,
    marketId: string,
    selectionId: string,
    limit?: number
  ): Promise<
    Array<{
      type: 'prediction' | 'bet' | 'alert';
      timestamp: string;
      data: any;
    }>
  >;
  getFeatureImportance(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<
    Array<{
      feature: string;
      importance: number;
      direction: 'positive' | 'negative';
    }>
  >;
  getConfidenceInterval(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<{
    lower: number;
    upper: number;
    confidence: number;
  }>;
  getModelPerformance(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[0][0];
  }>;
  getBettingStats(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<{
    totalBets: number;
    wonBets: number;
    lostBets: number;
    winRate: number;
    profitLoss: number;
    averageOdds: number;
    averageStake: number;
  }>;
  getMarketEfficiency(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<{
    efficiency: number;
    bias: number;
    volatility: number;
    liquidity: number;
  }>;
  getPerformanceMetrics(timeRange?: 'day' | 'week' | 'month'): Promise<PerformanceMetrics>;
  getRecentActivity(limit?: number): Promise<RecentActivity[0]>;
  private calculateWinRate;
  private calculateProfitLoss;
  private calculateROI;
  private calculateStreaks;
  private calculateAverageOdds;
  private calculateAverageStake;
  private calculatePredictionAccuracy;
  private calculateOpportunities;
}
