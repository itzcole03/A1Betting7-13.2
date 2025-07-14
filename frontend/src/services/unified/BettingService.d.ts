// import { RiskProfileType, BettingMetrics, BettingHistoryEntry, BettingOpportunity } from '@/types/betting';
interface BettingConfig {
  minConfidence: number;
  maxStakePercentage: number;
  riskProfile: any;
  autoRefresh: boolean;
  refreshInterval: number;
}
declare class UnifiedBettingService {
  private static instance;
  private readonly wsService;
  private config;
  private readonly apiUrl;
  protected constructor();
  static getInstance(): UnifiedBettingService;
  private initializeWebSocketHandlers;
  private handleOddsUpdate;
  private handleBettingOpportunities;
  private handleBetResult;
  private validateBettingOpportunities;
  private calculateOpportunityConfidence;
  private updateBettingMetrics;
  private calculateMetrics;
  private calculateWinRate;
  private calculateAverageOdds;
  private calculateROI;
  getBettingOpportunities(): Promise<any[]>;
  placeBet(bet: any): Promise<boolean>;
  getBettingMetrics(): Promise<any>;
  getBetHistory(): Promise<any[]>;
  setConfig(newConfig: Partial<BettingConfig>): void;
  getConfig(): BettingConfig;
  private emit;
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: unknown): Promise<T>;
}
export default UnifiedBettingService;
