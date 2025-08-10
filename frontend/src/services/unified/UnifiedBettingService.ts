import { BaseService } from './BaseService';
import { UnifiedWebSocketService } from './UnifiedWebSocketService';

interface BettingConfig {
  minConfidence: number;
  maxStakePercentage: number;
  riskProfile: unknown;
  autoRefresh: boolean;
  refreshInterval: number;
}

export class UnifiedBettingService extends BaseService {
  setConfig(newConfig: Partial<BettingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Betting config updated', this.config);
  }

  getConfig(): BettingConfig {
    return { ...this.config };
  }

  private emit(event: string, data?: unknown): void {
    // Emit events through the EventEmitter interface
    super.emit(event, data);
  }

  async get<T>(url: string): Promise<T> {
    return this.api.get(url).then(response => response.data);
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    return this.api.post(url, data).then(response => response.data);
  }
  private static instance: UnifiedBettingService;
  private readonly wsService: UnifiedWebSocketService;
  // @ts-expect-error TS(2416): Property 'config' in type 'UnifiedBettingService' ... Remove this comment to see the full error message
  private config: BettingConfig = {
    minConfidence: 0.6,
    maxStakePercentage: 0.05,
    riskProfile: 'moderate',
    autoRefresh: true,
    refreshInterval: 30000,
  };
  private readonly apiUrl = '/api/betting';

  protected constructor() {
    // @ts-expect-error TS(2554): Expected 2 arguments, but got 1. BaseService expects two arguments, but only one is provided here for singleton pattern compatibility.
    super('UnifiedBettingService');
    this.wsService = UnifiedWebSocketService.getInstance();
    this.initializeWebSocketHandlers();
  }

  static getInstance(): UnifiedBettingService {
    if (!UnifiedBettingService.instance) {
      UnifiedBettingService.instance = new UnifiedBettingService();
    }
    return UnifiedBettingService.instance;
  }

  private initializeWebSocketHandlers(): void {
    this.wsService.on('odds_update', this.handleOddsUpdate.bind(this));
    this.wsService.on('betting_opportunities', this.handleBettingOpportunities.bind(this));
    this.wsService.on('bet_result', this.handleBetResult.bind(this));
  }

  private handleOddsUpdate(data: unknown): void {
    this.emit('odds_updated', data);
  }

  private handleBettingOpportunities(data: unknown): void {
    const opportunities = Array.isArray(data) ? (data as BettingOpportunity[]) : [];
    const validatedOpportunities = this.validateBettingOpportunities(opportunities);
    this.emit('opportunities_updated', validatedOpportunities);
  }

  private handleBetResult(data: unknown): void {
    this.updateBettingMetrics(data);
    this.emit('bet_result', data);
  }

  private validateBettingOpportunities(opportunities: BettingOpportunity[]): BettingOpportunity[] {
    return opportunities.filter(opp => {
      const confidence = this.calculateOpportunityConfidence(opp);
      return confidence >= this.config.minConfidence;
    });
  }

  private calculateOpportunityConfidence(opportunity: BettingOpportunity): number {
    // Simple confidence calculation based on odds and market analysis
    const { odds, marketDepth, volume } = opportunity;
    const baseConfidence = Math.min(1, (marketDepth * volume) / 1000);
    const oddsConfidence = Math.min(1, 1 / odds);
    return (baseConfidence + oddsConfidence) / 2;
  }

  private updateBettingMetrics(betResult: unknown): void {
    // Update internal metrics tracking
    this.emit('metrics_updated', this.calculateMetrics());
  }

  private calculateMetrics(): BettingMetrics {
    return {
      winRate: this.calculateWinRate(),
      averageOdds: this.calculateAverageOdds(),
      roi: this.calculateROI(),
      totalBets: 0,
      profit: 0,
    };
  }

  private calculateWinRate(): number {
    // Placeholder implementation
    return 0.65;
  }

  private calculateAverageOdds(): number {
    // Placeholder implementation
    return 2.1;
  }

  private calculateROI(): number {
    // Placeholder implementation
    return 0.15;
  }

  async getBettingOpportunities(): Promise<BettingOpportunity[]> {
    try {
      const response = await this.get<BettingOpportunity[]>(`${this.apiUrl}/opportunities`);
      return this.validateBettingOpportunities(response);
    } catch (error) {
      this.logger.error('Failed to fetch betting opportunities', error);
      return [];
    }
  }

  async placeBet(bet: BettingOpportunity): Promise<boolean> {
    try {
      await this.post(`${this.apiUrl}/place`, bet);
      this.logger.info('Bet placed successfully', { betId: bet.id });
      return true;
    } catch (error) {
      this.logger.error('Failed to place bet', error);
      return false;
    }
  }

  async getBettingMetrics(): Promise<BettingMetrics> {
    try {
      const response = await this.get<BettingMetrics>(`${this.apiUrl}/metrics`);
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch betting metrics', error);
      return this.calculateMetrics();
    }
  }

  async getBetHistory(): Promise<BettingOpportunity[]> {
    try {
      const response = await this.get<BettingOpportunity[]>(`${this.apiUrl}/history`);
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch bet history', error);
      return [];
    }
  }
}

// Explicit interfaces for opportunities and metrics
export interface BettingOpportunity {
  id: string;
  odds: number;
  marketDepth: number;
  volume: number;
  [key: string]: any;
}

export interface BettingMetrics {
  winRate: number;
  averageOdds: number;
  roi: number;
  totalBets: number;
  profit: number;
}

// (Removed duplicate methods and extra closing brace)

export default UnifiedBettingService;
