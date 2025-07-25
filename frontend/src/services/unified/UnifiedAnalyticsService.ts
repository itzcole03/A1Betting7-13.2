import { PerformanceMetrics, RiskProfile } from '../../types/core';
// TrendDelta type for analytics trend API
export interface TrendDelta {
  trend: number;
  delta: number;
  period: 'day' | 'week' | 'month';
  confidence: number;
}
import { BaseService } from './BaseService';
import { _masterServiceRegistry } from '../MasterServiceRegistry'; // Import the instance
import { UnifiedStateService } from './UnifiedStateService';
import { UnifiedBettingService } from './UnifiedBettingService';
import { UnifiedPredictionService } from './UnifiedPredictionService';
import { UnifiedErrorService } from './UnifiedErrorService';

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
  private static registry: unknown;
  private stateService: UnifiedStateService;
  private bettingService: UnifiedBettingService;
  private predictionService: UnifiedPredictionService;
  private errorService: UnifiedErrorService;

  static getInstance(registry?: typeof _masterServiceRegistry): UnifiedAnalyticsService {
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

  constructor(registry: typeof _masterServiceRegistry) {
    console.log(
      '[DEBUG] UnifiedAnalyticsService.constructor called with registry:',
      registry,
      registry ? Object.keys(registry) : null
    );
    if (registry && registry.configuration) {
      console.log('[DEBUG] registry.configuration:', registry.configuration);
      // Removed conditional check for getApiUrl as it's not directly on config
    }
    super('analytics', registry);
    this.stateService = registry.getService<UnifiedStateService>('state')!;
    this.bettingService = registry.getService<UnifiedBettingService>('betting')!;
    this.predictionService = registry.getService<UnifiedPredictionService>('predictions')!;
    this.errorService = registry.getService<UnifiedErrorService>('errors')!;
  }

  // Renamed to avoid duplicate member error;
  async getPerformanceMetricsApi(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<PerformanceMetrics> {
    const _response = await this.api.get(`/analytics/performance`, {
      params: { eventId, marketId, selectionId },
    });
    return _response.data;
  }

  async getTrendDelta(
    eventId: string,
    marketId: string,
    selectionId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<TrendDelta> {
    const _response = await this.api.get(`/analytics/trend`, {
      params: { eventId, marketId, selectionId, period },
    });
    return _response.data;
  }

  async getRiskProfile(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<RiskProfile> {
    const _response = await this.api.get(`/analytics/risk`, {
      params: { eventId, marketId, selectionId },
    });
    return _response.data;
  }

  async getExplainabilityMap(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<unknown[]> {
    const _response = await this.api.get(`/analytics/explainability`, {
      params: { eventId, marketId, selectionId },
    });
    return _response.data;
  }

  async getModelMetadata(eventId: string, marketId: string, selectionId: string): Promise<unknown> {
    const _response = await this.api.get(`/analytics/model`, {
      params: { eventId, marketId, selectionId },
    });
    return _response.data;
  }

  // Renamed to avoid duplicate member error;
  async getRecentActivityApi(
    eventId: string,
    marketId: string,
    selectionId: string,
    limit: number = 10
  ): Promise<unknown[]> {
    const _response = await this.api.get(`/analytics/activity`, {
      params: { eventId, marketId, selectionId, limit },
    });
    return _response.data;
  }

  async getFeatureImportance(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<Array<{ feature: string; importance: number; direction: 'positive' | 'negative' }>> {
    const _response = await this.api.get(`/analytics/features`, {
      params: { eventId, marketId, selectionId },
    });
    return _response.data;
  }

  async getConfidenceInterval(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<{ lower: number; upper: number; confidence: number }> {
    const _response = await this.api.get(`/analytics/confidence`, {
      params: { eventId, marketId, selectionId },
    });
    return _response.data;
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
    const _response = await this.api.get(`/analytics/model-performance`, {
      params: { eventId, marketId, selectionId },
    });
    return _response.data;
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
    const _response = await this.api.get(`/analytics/betting-stats`, {
      params: { eventId, marketId, selectionId },
    });
    return _response.data;
  }

  async getMarketEfficiency(
    eventId: string,
    marketId: string,
    selectionId: string
  ): Promise<{ efficiency: number; bias: number; volatility: number; liquidity: number }> {
    const _response = await this.api.get(`/analytics/market-efficiency`, {
      params: { eventId, marketId, selectionId },
    });
    return _response.data;
  }

  async getPerformanceMetrics(
    timeRange: 'day' | 'week' | 'month' = 'week'
  ): Promise<PerformanceMetrics> {
    try {
      // Stub for getBets and getPredictions
      const _bets: unknown[] = [];
      const _predictions: unknown[] = [];
      // Stub for calculateStreaks
      const _bestStreak = 0;
      const _currentStreak = 0;
      // Stub for metrics
      const _totalBets = 0;
      const _activeBets = 0;
      const _winRate = 0;
      const _profitLoss = 0;
      const _accuracy = 0;
      // Return all required fields for PerformanceMetrics
      return {
        totalBets: _totalBets,
        winRate: _winRate,
        roi: 0,
        profitLoss: _profitLoss,
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

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const [_bets, _predictions, _opportunities] = await Promise.all([
        (this.bettingService as any).getRecentBets(limit),
        (this.predictionService as any).getRecentPredictions(limit),
        (this.predictionService as any).getRecentOpportunities(limit),
      ]);

      const _activities: RecentActivity[] = [
        ...(_bets as any[]).map((_bet: any) => ({
          id: _bet.id,
          type: 'bet' as const,
          description: `Bet placed on ${_bet.event}`,
          amount: _bet.amount,
          odds: _bet.odds,
          timestamp: _bet.timestamp,
          status: _bet.status,
        })),
        ...(_predictions as any[]).map((_pred: any) => ({
          id: _pred.id,
          type: 'prediction' as const,
          description: `Prediction for ${_pred.event}`,
          timestamp: _pred.timestamp,
          status: _pred.status,
        })),
        ...(_opportunities as any[]).map((_opp: any) => ({
          id: _opp.id,
          type: 'opportunity' as const,
          description: `Opportunity detected for ${_opp.event}`,
          timestamp: _opp.timestamp,
          status: _opp.status,
        })),
      ];

      return _activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    } catch (error) {
      (this.errorService as any).handleError(error, {
        code: 'ANALYTICS_ERROR',
        source: 'UnifiedAnalyticsService',
        details: { method: 'getRecentActivity', limit },
      });
      throw error;
    }
  }

  private calculateWinRate(bets: { status: string }[]): number {
    if (bets.length === 0) return 0;
    const _wonBets = bets.filter(b => b.status === 'won').length;
    return (_wonBets / bets.length) * 100;
  }

  private calculateProfitLoss(bets: { payout: number; stake: number; status: string }[]): number {
    let _profitLoss = 0;
    return bets.reduce((total: number, bet: { payout: number; stake: number; status: string }) => {
      if (bet.status === 'won') {
        _profitLoss += bet.payout - bet.stake;
      }
      return total;
    }, 0);
  }

  private calculateROI(bets: { payout: number; stake: number }[]): number {
    if (bets.length === 0) return 0;
    const _profitLoss = bets.reduce((total, b) => total + (b.payout - b.stake), 0);
    const _totalStaked = bets.reduce((total, b) => total + b.stake, 0);
    return _totalStaked === 0 ? 0 : (_profitLoss / _totalStaked) * 100;
  }

  private calculateStreaks(bets: { status: string }[]): { bestStreak: number; currentStreak: number } {
    let _currentStreak = 0;
    let _bestStreak = 0;
    for (let i = bets.length - 1; i >= 0; i--) {
      if (bets[i].status === 'won') {
        _currentStreak++;
      } else {
        _currentStreak = 0;
      }
      if (_currentStreak > _bestStreak) {
        _bestStreak = _currentStreak;
      }
    }
    return { bestStreak: _bestStreak, currentStreak: _currentStreak };
  }

  private calculateAverageOdds(bets: { odds: number }[]): number {
    if (bets.length === 0) return 0;
    const _totalOdds = bets.reduce((total, b) => total + b.odds, 0);
    return _totalOdds / bets.length;
  }

  private calculateAverageStake(bets: { stake: number }[]): number {
    if (bets.length === 0) return 0;
    const _totalStaked = bets.reduce((total, b) => total + b.stake, 0);
    return _totalStaked / bets.length;
  }

  private calculatePredictionAccuracy(predictions: { status: string }[]): number {
    if (predictions.length === 0) return 0;
    const _correctPredictions = predictions.filter(p => p.status === 'correct').length;
    return (_correctPredictions / predictions.length) * 100;
  }

  private calculateOpportunities(predictions: { status: string }[]): number {
    return predictions.filter((pred: { status: string }) => pred.status === 'opportunity').length;
  }

  private someMethodWithImplicitAny(bet: unknown, pred: unknown, opp: unknown, a: unknown, b: unknown, total: unknown) {
    // Stub for missing variables and logic
    const _wonBets = 0;
    // ...
  }
}
