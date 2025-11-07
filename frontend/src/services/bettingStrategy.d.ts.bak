import { BookOdds, BettingOpportunity, TeaserLeg, TeaserStrategy } from '@/types/betting.ts';
export declare class BettingStrategyService {
  private static instance;
  private historicalData;
  private activeAlerts;
  private constructor();
  static getInstance(): BettingStrategyService;
  private validateMarket;
  detectArbitrage(markets: Map<string, BookOdds[0]>): BettingOpportunity[0];
  findMiddleOpportunities(markets: Map<string, BookOdds[0]>): BettingOpportunity[0];
  optimizeTeaserStrategy(legs: TeaserLeg[0], points: number): TeaserStrategy;
  private validateCorrelation;
  private findBestOdds;
  private calculateTotalImpliedProbability;
  private americanToDecimal;
  private oddsToSpread;
  private calculateMiddleEV;
  private adjustOddsForTeaser;
  private calculateTotalTeaserOdds;
  private calculateTeaserEV;
  private calculatePayout;
  addHistoricalData(market: string, odds: BookOdds): void;
  getHistoricalData(market: string): BookOdds[0];
  private createOpportunity;
}
export default BettingStrategyService;
