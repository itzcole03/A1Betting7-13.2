import { BettingOdds, LineShoppingResult, Sportsbook } from '@/types/betting.ts';
import { EventEmitter } from 'events.ts';
export declare class LineShoppingService extends EventEmitter {
  private sportsbooks;
  private oddsCache;
  private readonly CACHE_TTL;
  constructor();
  /**
   * Register a sportsbook for line shopping;
   */
  registerSportsbook(sportsbook: Sportsbook): void;
  /**
   * Update odds for a specific sportsbook;
   */
  updateOdds(bookmakerId: string, odds: BettingOdds[0]): void;
  /**
   * Find the best odds for a specific selection;
   */
  findBestOdds(eventId: string, market: string, selection: string): LineShoppingResult | null;
  /**
   * Calculate confidence score for odds;
   */
  private calculateConfidence;
  /**
   * Get all available odds for a specific event and market;
   */
  getMarketOdds(eventId: string, market: string): Map<string, BettingOdds[0]> | null;
  /**
   * Clear expired odds from cache;
   */
  clearExpiredOdds(): void;
}
