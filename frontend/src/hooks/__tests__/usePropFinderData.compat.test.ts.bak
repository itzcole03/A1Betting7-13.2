import { mapRawOpportunity, mapSummaryToStats } from '../usePropFinderData';

describe('usePropFinderData compatibility helpers', () => {
  describe('mapRawOpportunity', () => {
    it('normalizes numeric fields and preserves bookmaker data', () => {
      const raw = {
        id: 'opp-123',
        player: 'Jane Smith',
        team: 'LAL',
        opponent: 'BOS',
        sport: 'NBA',
        market: 'Points',
        line: '27.5',
        pick: 'over',
        odds: '-115',
        impliedProbability: '0.52',
        aiProbability: 0.58,
        edge: '4.8',
        confidence: '71',
        projectedValue: '28.1',
        recentForm: ['23', '31', '19'],
        bookmakers: [
          {
            name: 'FanDuel',
            odds: -115,
            line: 27.5,
          },
          {
            name: 'DraftKings',
            odds: -110,
            line: 27,
          },
        ],
        implied_prob_market: '0.52',
        implied_prob_fair: '0.55',
        edge_pct: '4.2',
        expected_value_per_100: '6.3',
        vig_percent: '2.1',
        isLowJuice: true,
        lastUpdated: '2025-10-01T12:00:00Z',
      };

      const opportunity = mapRawOpportunity(raw);

      expect(opportunity.id).toBe('opp-123');
      expect(opportunity.player).toBe('Jane Smith');
      expect(opportunity.line).toBeCloseTo(27.5);
      expect(opportunity.odds).toBeCloseTo(-115);
      expect(opportunity.projectedValue).toBeCloseTo(28.1);
      expect(opportunity.recentForm).toEqual([23, 31, 19]);
      expect(opportunity.bookmakers).toHaveLength(2);
      expect(opportunity.bookmakers?.[0]).toEqual({
        name: 'FanDuel',
        odds: -115,
        line: 27.5,
      });
      expect(opportunity.impliedProbMarket).toBeCloseTo(0.52);
      expect(opportunity.impliedProbFair).toBeCloseTo(0.55);
      expect(opportunity.edgePct).toBeCloseTo(4.2);
      expect(opportunity.expectedValuePer100).toBeCloseTo(6.3);
      expect(opportunity.vigPercent).toBeCloseTo(2.1);
      expect(opportunity.isLowJuice).toBe(true);
    });

    it('merges CLV metrics from override map and handles snake_case payloads', () => {
      const raw = {
        id: 'opp-999',
        player: 'Alex Johnson',
        clv_percent: '3.2',
        closing_line: '29.5',
        closing_odds: '-108',
      };

      const clvMap = new Map<
        string,
        { clvPercent?: number; closingLine?: number; closingOdds?: number }
      >([['opp-999', { clvPercent: 6.4, closingLine: 30, closingOdds: -112 }]]);

      const opportunity = mapRawOpportunity(raw, clvMap);

      expect(opportunity.clvPercent).toBeCloseTo(6.4);
      expect(opportunity.closingLine).toBeCloseTo(30);
      expect(opportunity.closingOdds).toBeCloseTo(-112);
    });

    it('falls back to generated id when none is provided', () => {
      const raw = {
        player: 'Generated Player',
      };

      const opportunity = mapRawOpportunity(raw);
      expect(opportunity.id).toMatch(/^opp-/);
      expect(opportunity.player).toBe('Generated Player');
    });
  });

  describe('mapSummaryToStats', () => {
    it('extracts metrics from mixed key formats', () => {
      const summary = {
        totalOpportunities: '42',
        avg_confidence: 61.5,
        maxEdge: '12.1',
        alertTriggeredCount: '7',
        sharpHeavyCount: 11,
        sports_count: 4,
        marketsCount: '6',
        lastUpdated: '2025-10-01T00:00:00Z',
      };

      const stats = mapSummaryToStats(summary);

      expect(stats.total_opportunities).toBe(42);
      expect(stats.avg_confidence).toBeCloseTo(61.5);
      expect(stats.max_edge).toBeCloseTo(12.1);
      expect(stats.alert_triggered_count).toBe(7);
      expect(stats.sharp_heavy_count).toBe(11);
      expect(stats.sports_count).toBe(4);
      expect(stats.markets_count).toBe(6);
      expect(stats.last_updated).toBe('2025-10-01T00:00:00Z');
    });

    it('falls back to defaults when keys are missing', () => {
      const stats = mapSummaryToStats({});

      expect(stats.total_opportunities).toBe(0);
      expect(stats.avg_confidence).toBe(0);
      expect(stats.max_edge).toBe(0);
      expect(stats.alert_triggered_count).toBe(0);
      expect(stats.sharp_heavy_count).toBe(0);
      expect(stats.sports_count).toBe(0);
      expect(stats.markets_count).toBe(0);
      expect(typeof stats.last_updated).toBe('string');
    });
  });
});
