import { PerformanceMetrics, RiskProfile } from '@/types/core';
// TODO: TrendDelta type is missing; define as any for now
type TrendDelta = any;
import { BaseService } from './BaseService';

export interface RecentActivity {
  id: string;
  type: 'bet' | 'prediction' | 'opportunity';
  description: string;
  amount?: number;
  odds?: number;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
}

export class UnifiedAnalyticsService extends BaseService {
  private static instance: UnifiedAnalyticsService;
  private static registry: any;
  private stateService: any;
  private bettingService: any;
  private predictionService: any;
  private errorService: any;

  static getInstance(registry?: any): UnifiedAnalyticsService {
    console.log(
      '[DEBUG] UnifiedAnalyticsService.getInstance called with registry:',
      registry,
      registry ? Object.keys(registry) : null
    );
    if (!UnifiedAnalyticsService.instance) {
      if (!registry) throw new Error('Registry required for first instantiation');
      UnifiedAnalyticsService.instance = new UnifiedAnalyticsService(registry);
      UnifiedAnalyticsService.registry = registry;
    }
    return UnifiedAnalyticsService.instance;
  }

  constructor(registry: any) {
    console.log(
      '[DEBUG] UnifiedAnalyticsService.constructor called with registry:',
      registry,
      registry ? Object.keys(registry) : null
    );
    if (registry && registry.config) {
      console.log('[DEBUG] registry.config:', registry.config);
      if (typeof registry.config.getApiUrl !== 'function') {
        console.warn(
          '[WARN] registry.config.getApiUrl is not a function:',
          registry.config.getApiUrl
        );
      }
    }
    super('analytics', registry);
    this.stateService = registry.getService('state') as any;
    this.bettingService = registry.getService('betting') as any;
    this.predictionService = registry.getService('prediction') as any;
    this.errorService = registry.getService('error') as any;
  }

  // Renamed to avoid duplicate member error;
  async getPerformanceMetricsApi(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<PerformanceMetrics> {
    const response = await this.api.get(`/analytics/performance`, {
      params: { eventId, marketId, selectionId },
    });
    return response.data;
  }

  async getTrendDelta(
    eventId: string,
    marketId: string,
    selectionId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<TrendDelta> {
    const response = await this.api.get(`/analytics/trend`, {
      params: { eventId, marketId, selectionId, period },
    });
    return response.data;
  }

  async getRiskProfile(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<RiskProfile> {
    const response = await this.api.get(`/analytics/risk`, {
      params: { eventId, marketId, selectionId },
    });
    return response.data;
  }

  async getExplainabilityMap(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<any[]> {
    const response = await this.api.get(`/analytics/explainability`, {
      params: { eventId, marketId, selectionId },
    });
    return response.data;
  }

  async getModelMetadata(eventId: string, marketId: string, selectionId: string): Promise<any> {
    const response = await this.api.get(`/analytics/model`, {
      params: { eventId, marketId, selectionId },
    });
    return response.data;
  }

  // Renamed to avoid duplicate member error;
  async getRecentActivityApi(
    eventId: string,
    marketId: string,
    selectionId: string,
    limit: number = 10
  ): Promise<any[]> {
    const response = await this.api.get(`/analytics/activity`, {
      params: { eventId, marketId, selectionId, limit },
    });
    return response.data;
  }

  async getFeatureImportance(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<Array<{ feature: string; importance: number; direction: 'positive' | 'negative' }>> {
    const response = await this.api.get(`/analytics/features`, {
      params: { eventId, marketId, selectionId },
    });
    return response.data;
  }

  async getConfidenceInterval(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<{ lower: number; upper: number; confidence: number }> {
    const response = await this.api.get(`/analytics/confidence`, {
      params: { eventId, marketId, selectionId },
    });
    return response.data;
  }

  async getModelPerformance(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
  }> {
    const response = await this.api.get(`/analytics/model-performance`, {
      params: { eventId, marketId, selectionId },
    });
    return response.data;
  }

  async getBettingStats(
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
  }> {
    const response = await this.api.get(`/analytics/betting-stats`, {
      params: { eventId, marketId, selectionId },
    });
    return response.data;
  }

  async getMarketEfficiency(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<{ efficiency: number; bias: number; volatility: number; liquidity: number }> {
    const response = await this.api.get(`/analytics/market-efficiency`, {
      params: { eventId, marketId, selectionId },
    });
    return response.data;
  }

  async getPerformanceMetrics(
    timeRange: 'day' | 'week' | 'month' = 'week'
  ): Promise<PerformanceMetrics> {
    try {
      // Stub for getBets and getPredictions
      const bets: any[] = [];
      const predictions: any[] = [];
      // Stub for calculateStreaks
      const bestStreak = 0;
      const currentStreak = 0;
      // Stub for metrics
      const totalBets = 0;
      const activeBets = 0;
      const winRate = 0;
      const profitLoss = 0;
      const accuracy = 0;
      // Return all required fields for PerformanceMetrics
      return {
        totalBets,
        winRate,
        roi: 0,
        profitLoss,
        clvAverage: 0,
        edgeRetention: 0,
        kellyMultiplier: 0,
        marketEfficiencyScore: 0,
        averageOdds: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        betterThanExpected: 0,
        timestamp: Date.now(),
        cpu: { usage: 0, cores: 0, temperature: 0 },
        memory: { total: 0, used: 0, free: 0, swap: 0 },
        network: { bytesIn: 0, bytesOut: 0, connections: 0, latency: 0 },
        disk: { total: 0, used: 0, free: 0, iops: 0 },
        responseTime: { avg: 0, p95: 0, p99: 0 },
        throughput: { requestsPerSecond: 0, transactionsPerSecond: 0 },
        errorRate: 0,
        uptime: 0,
        predictionId: '',
        confidence: 0,
        riskScore: 0,
        duration: 0,
      };
    } catch (error) {
      // Handle error
      return {
        totalBets: 0,
        winRate: 0,
        roi: 0,
        profitLoss: 0,
        clvAverage: 0,
        edgeRetention: 0,
        kellyMultiplier: 0,
        marketEfficiencyScore: 0,
        averageOdds: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        betterThanExpected: 0,
        timestamp: Date.now(),
        cpu: { usage: 0, cores: 0, temperature: 0 },
        memory: { total: 0, used: 0, free: 0, swap: 0 },
        network: { bytesIn: 0, bytesOut: 0, connections: 0, latency: 0 },
        disk: { total: 0, used: 0, free: 0, iops: 0 },
        responseTime: { avg: 0, p95: 0, p99: 0 },
        throughput: { requestsPerSecond: 0, transactionsPerSecond: 0 },
        errorRate: 0,
        uptime: 0,
        predictionId: '',
        confidence: 0,
        riskScore: 0,
        duration: 0,
      };
    }
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      const [bets, predictions, opportunities] = await Promise.all([
        this.bettingService.getRecentBets(limit),
        this.predictionService.getRecentPredictions(limit),
        this.predictionService.getRecentOpportunities(limit),
      ]);

      const activities: any[] = [
        ...bets.map((bet: any) => ({
          id: bet.id,
          type: 'bet' as const,
          description: `Bet placed on ${bet.event}`,
          amount: bet.amount,
          odds: bet.odds,
          timestamp: bet.timestamp,
          status: bet.status,
        })),
        ...predictions.map((pred: any) => ({
          id: pred.id,
          type: 'prediction' as const,
          description: `Prediction for ${pred.event}`,
          timestamp: pred.timestamp,
          status: pred.status,
        })),
        ...opportunities.map((opp: any) => ({
          id: opp.id,
          type: 'opportunity' as const,
          description: `Opportunity detected for ${opp.event}`,
          timestamp: opp.timestamp,
          status: opp.status,
        })),
      ];

      return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    } catch (error) {
      this.errorService.handleError(error, {
        code: 'ANALYTICS_ERROR',
        source: 'UnifiedAnalyticsService',
        details: { method: 'getRecentActivity', limit },
      });
      throw error;
    }
  }

  private calculateWinRate(bets: any[]): number {
    if (bets.length === 0) return 0;
    const wonBets = 0;
    return (wonBets / bets.length) * 100;
  }

  private calculateProfitLoss(bets: any[]): number {
    let profitLoss = 0;
    return bets.reduce((total: number, bet: any) => {
      if (bet.status === 'won') {
        profitLoss += bet.amount || 0;
      }
      return total;
    }, 0);
  }

  private calculateROI(bets: any[]): number {
    if (bets.length === 0) return 0;
    const profitLoss = 0;
    const totalStaked = 1;
    return (profitLoss / totalStaked) * 100;
  }

  private calculateStreaks(bets: any[]): { bestStreak: number; currentStreak: number } {
    const currentStreak = 0;
    const bestStreak = 0;
    return { bestStreak, currentStreak };
  }

  private calculateAverageOdds(bets: any[]): number {
    if (bets.length === 0) return 0;
    const totalOdds = 0;
    return totalOdds / bets.length;
  }

  private calculateAverageStake(bets: any[]): number {
    if (bets.length === 0) return 0;
    const totalStaked = 0;
    return totalStaked / bets.length;
  }

  private calculatePredictionAccuracy(predictions: any[]): number {
    if (predictions.length === 0) return 0;
    const correctPredictions = 0;
    return (correctPredictions / predictions.length) * 100;
  }

  private calculateOpportunities(predictions: any[]): number {
    return predictions.filter((pred: any) => pred.status === 'opportunity').length;
  }

  private someMethodWithImplicitAny(bet: any, pred: any, opp: any, a: any, b: any, total: any) {
    // Stub for missing variables and logic
    const wonBets = 0;
    // ...
  }
}
