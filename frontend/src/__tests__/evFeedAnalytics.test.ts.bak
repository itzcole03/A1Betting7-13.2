import { EVOpportunity, EVTier } from '../types/ev-types';
import { appendHistorySnapshot, computeEvSummary } from '../utils/evFeedAnalytics';

describe('evFeedAnalytics utilities', () => {
  const sampleOpportunities: EVOpportunity[] = [
    {
      id: '1',
      player: 'Player A',
      market: 'Points Over 24.5',
      sport: 'NBA' as any,
      market_type: 'player_props' as any,
      our_fair_odds: -110,
      market_odds: -105,
      ev_percent: 6.2,
      source_book: 'FanDuel',
      game_info: 'Team A @ Team B',
      updated_at: new Date().toISOString(),
      ev_tier: EVTier.MEDIUM,
      implied_probability: 0.52,
      fair_implied_probability: 0.53,
    },
    {
      id: '2',
      player: 'Player B',
      market: 'Rebounds Over 8.5',
      sport: 'NBA' as any,
      market_type: 'player_props' as any,
      our_fair_odds: 120,
      market_odds: 135,
      ev_percent: 12.4,
      source_book: 'DraftKings',
      game_info: 'Team C @ Team D',
      updated_at: new Date().toISOString(),
      ev_tier: EVTier.EXTREME,
      implied_probability: 0.42,
      fair_implied_probability: 0.47,
    },
  ];

  it('computes aggregate summary metrics', () => {
    const summary = computeEvSummary(sampleOpportunities);
    expect(summary.total).toBe(2);
    expect(summary.averageEv).toBeCloseTo((6.2 + 12.4) / 2);
    expect(summary.topEv).toBeCloseTo(12.4);
    expect(summary.uniqueBooks).toBe(2);
    expect(summary.tierBreakdown[EVTier.MEDIUM]).toBe(1);
    expect(summary.tierBreakdown[EVTier.EXTREME]).toBe(1);
  });

  it('records rolling history snapshots', () => {
    const history = appendHistorySnapshot([], sampleOpportunities, 5);
    expect(history).toHaveLength(1);
    expect(history[0].count).toBe(2);
    expect(history[0].averageEv).toBeGreaterThan(0);

    const extended = appendHistorySnapshot(history, sampleOpportunities, 1);
    expect(extended).toHaveLength(1);
  });
});
