import EventEmitter from 'eventemitter3';
// @ts-expect-error TS(2614): Module '"./UnifiedPredictionService"' has no expor... Remove this comment to see the full error message
import { PredictionResult } from './UnifiedPredictionService';

export interface BetResult {
  propId: string;
  prediction: PredictionResult;
  actualValue: number;
  isWin: boolean;
  stakeAmount: number;
  profitLoss: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  winRate: number;
  roi: number;
  totalBets: number;
  profitLoss: number;
  averageStake: number;
  streaks: {
    current: number;
    longest: number;
  };
  byConfidence: {
    [key: string]: {
      winRate: number;
      totalBets: number;
    };
  };
}

export interface SystemMetrics {
  apiLatency: number;
  predictionAccuracy: number;
  errorRate: number;
  processingTime: number;
}

export class PerformanceTrackingService extends EventEmitter {
  private betHistory: BetResult[] = [];
  private systemMetrics: SystemMetrics = {
    apiLatency: 0,
    predictionAccuracy: 0,
    errorRate: 0,
    processingTime: 0,
  };

  // User Performance Tracking;
  public recordBetResult(result: BetResult): void {
    this.betHistory.push(result);
    this.emit('betRecorded', result);
    this.updateMetrics();
  }

  public getPerformanceMetrics(timeRange?: { start: number; end: number }): PerformanceMetrics {
    let _relevantBets = this.betHistory;
    if (timeRange) {
      relevantBets = this.betHistory.filter(
        bet => bet.timestamp >= timeRange.start && bet.timestamp <= timeRange.end
      );
    }
    const _metrics: PerformanceMetrics = {
      winRate: this.calculateWinRate(relevantBets),
      roi: this.calculateROI(relevantBets),
      totalBets: relevantBets.length,
      profitLoss: this.calculateTotalProfitLoss(relevantBets),
      averageStake: this.calculateAverageStake(relevantBets),
      streaks: this.calculateStreaks(relevantBets),
      byConfidence: this.calculateMetricsByConfidence(relevantBets),
    };
    return metrics;
  }

  // System Performance Tracking;
  public updateSystemMetrics(metrics: Partial<SystemMetrics>): void {
    this.systemMetrics = { ...this.systemMetrics, ...metrics };
    this.emit('systemMetricsUpdated', this.systemMetrics);
  }

  public getSystemMetrics(): SystemMetrics {
    return this.systemMetrics;
  }

  // Private helper methods;
  private calculateWinRate(bets: BetResult[]): number {
    if (bets.length === 0) return 0;
    let _wins = 0;
    bets.forEach(bet => {
      if (bet.isWin) wins++;
    });
    return (wins / bets.length) * 100;
  }

  private calculateROI(bets: BetResult[]): number {
    if (bets.length === 0) return 0;
    let _totalProfit = 0;
    let _totalStake = 0;
    bets.forEach(bet => {
      totalProfit += bet.profitLoss;
      totalStake += bet.stakeAmount;
    });
    return totalStake === 0 ? 0 : (totalProfit / totalStake) * 100;
  }

  private calculateTotalProfitLoss(bets: BetResult[]): number {
    return bets.reduce((sum, bet) => sum + bet.profitLoss, 0);
  }

  private calculateAverageStake(bets: BetResult[]): number {
    if (bets.length === 0) return 0;
    let _totalStake = 0;
    bets.forEach(bet => {
      totalStake += bet.stakeAmount;
    });
    return totalStake / bets.length;
  }

  private calculateStreaks(bets: BetResult[]): { current: number; longest: number } {
    let _current = 0;
    let _longest = 0;
    let _isWinStreak = false;
    bets.forEach((bet, index) => {
      if (index === 0) {
        current = 1;
        longest = 1;
        isWinStreak = bet.isWin;
      } else if (bet.isWin === isWinStreak) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
        isWinStreak = bet.isWin;
      }
    });
    return { current, longest };
  }

  private calculateMetricsByConfidence(bets: BetResult[]): PerformanceMetrics['byConfidence'] {
    const _confidenceBuckets: PerformanceMetrics['byConfidence'] = {};
    bets.forEach(bet => {
      const _key = String((bet.prediction as unknown)?.confidence ?? 'unknown');
      if (!confidenceBuckets[key]) {
        confidenceBuckets[key] = {
          winRate: 0,
          totalBets: 0,
        };
      }
      confidenceBuckets[key].totalBets++;
      if (bet.isWin) {
        confidenceBuckets[key].winRate =
          (confidenceBuckets[key].winRate * (confidenceBuckets[key].totalBets - 1) + 100) /
          confidenceBuckets[key].totalBets;
      }
    });
    return confidenceBuckets;
  }

  private updateMetrics(): void {
    // Stub metrics for now
    const _metrics: PerformanceMetrics = {
      winRate: 0,
      roi: 0,
      totalBets: 0,
      profitLoss: 0,
      averageStake: 0,
      streaks: { current: 0, longest: 0 },
      byConfidence: {},
    };
    this.emit('metricsUpdated', metrics);
  }
}
