import { SocialSentimentData } from '@/adapters/SocialSentimentAdapter.ts';
import { DataSource } from './DataSource.ts';
export interface IntegratedData {
  timestamp: number;
  projections: {
    [playerId: string]: {
      stats: Record<string, number>;
      confidence: number;
      lastUpdated: number;
    };
  };
  sentiment: {
    [playerId: string]: SocialSentimentData;
  };
  odds: {
    [eventId: string]: {
      markets: Record<string, number>;
      movement: {
        direction: 'up' | 'down' | 'stable';
        magnitude: number;
      };
    };
  };
  injuries: {
    [playerId: string]: {
      status: string;
      details: string;
      impact: number;
      timeline: string;
    };
  };
  trends: {
    [metric: string]: {
      value: number;
      change: number;
      significance: number;
    };
  };
}
export interface DataSourceMetrics {
  latency: number;
  reliability: number;
  accuracy: number;
  lastSync: number;
}
export declare class DataIntegrationHub {
  private static instance;
  private readonly eventBus;
  private readonly performanceMonitor;
  private readonly dataSources;
  private readonly sourceMetrics;
  private integratedData;
  private correlationCache;
  private dataCache;
  private syncInterval;
  private isRealTimeEnabled;
  private constructor();
  static getInstance(): DataIntegrationHub;
  private initializeIntegratedData;
  registerDataSource(source: DataSource<any>): void;
  startRealTimeSync(): Promise<void>;
  stopRealTimeSync(): void;
  setSyncInterval(milliseconds: number): void;
  private synchronizeAll;
  private updateSourceMetrics;
  private integrateData;
  private calculateDataConfidence;
  private updateIntegratedDataSource;
  private integrateProjections;
  private integratePrizePicksProjections;
  private integrateSentiment;
  private integrateSportsData;
  private integrateOdds;
  private calculateInjuryImpact;
  private calculateOddsMovement;
  private analyzeTrendsWithCorrelations;
  private analyzeProjectionTrends;
  private analyzeSentimentTrends;
  private analyzeMarketTrends;
  private analyzeCorrelationTrends;
  private calculateTrendSignificance;
  private calculateCorrelation;
  private setupEventListeners;
  getIntegratedData(): IntegratedData;
  getSourceMetrics(): Map<string, DataSourceMetrics>;
}
