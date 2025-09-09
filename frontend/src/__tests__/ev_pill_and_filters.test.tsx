import { describe, it, expect } from '@jest/globals';
import { classifyEvPillTier } from '../utils/evFormatting';
import { applyFilters, computeVolatility, FilterOptions } from '../utils/propfinderFilterUtils';
import type { PropOpportunity } from '../hooks/usePropFinderData';

const sampleOpp = (overrides: Partial<PropOpportunity> = {}): PropOpportunity => ({
  id: overrides.id || 'id-1',
  player: overrides.player || 'Test Player',
  team: overrides.team || 'Team A',
  opponent: overrides.opponent || 'Team B',
  sport: overrides.sport || 'NBA',
  market: overrides.market || 'Points',
  line: overrides.line ?? 25.5,
  pick: overrides.pick || 'over',
  odds: overrides.odds ?? -110,
  impliedProbability: overrides.impliedProbability ?? 52.4,
  aiProbability: overrides.aiProbability ?? 55,
  edge: overrides.edge ?? 3.2,
  confidence: overrides.confidence ?? 72,
  projectedValue: overrides.projectedValue ?? 1.25,
  volume: overrides.volume ?? 1000,
  trend: overrides.trend || 'stable',
  trendStrength: overrides.trendStrength ?? 0,
  timeToGame: overrides.timeToGame || '3h',
  venue: overrides.venue || 'home',
  recentForm: overrides.recentForm || [20, 28, 22, 30],
  bookmakers: overrides.bookmakers || [{ name: 'FD', odds: -110, line: 25.5 }],
  isBookmarked: overrides.isBookmarked ?? false,
  sharpMoney: overrides.sharpMoney || 'moderate',
  bestBookmaker: overrides.bestBookmaker || 'FD',
  lineSpread: overrides.lineSpread ?? 0.5,
  oddsSpread: overrides.oddsSpread ?? 5,
  numBookmakers: overrides.numBookmakers ?? 3,
  hasArbitrage: overrides.hasArbitrage ?? false,
  arbitrageProfitPct: overrides.arbitrageProfitPct ?? 0,
  evPercent: overrides.evPercent,
  evValue: overrides.evValue,
});

describe('EV Pill classification', () => {
  it('classifies tiers per thresholds', () => {
    expect(classifyEvPillTier(9)).toBe('green');
    expect(classifyEvPillTier(7)).toBe('green');
    expect(classifyEvPillTier(5)).toBe('orange');
    expect(classifyEvPillTier(4)).toBe('orange');
    expect(classifyEvPillTier(2.5)).toBe('yellow');
    expect(classifyEvPillTier(2)).toBe('yellow');
    expect(classifyEvPillTier(1.9)).toBe('gray');
    expect(classifyEvPillTier(undefined)).toBe('gray');
  });
});

describe('Filter utils', () => {
  const data: PropOpportunity[] = [
    sampleOpp({ id: 'a', evPercent: 8, hasArbitrage: true, isBookmarked: true, recentForm: [10, 20, 30] }),
    sampleOpp({ id: 'b', evPercent: 3.5, hasArbitrage: false, isBookmarked: false, recentForm: [10, 12, 13] }),
    sampleOpp({ id: 'c', evPercent: 1.5, hasArbitrage: true, isBookmarked: false, sport: 'MLB', recentForm: [5, 5, 5] }),
  ];

  it('computes volatility as max-min of recentForm', () => {
    expect(computeVolatility(data[0])).toBe(20);
    expect(computeVolatility(data[1])).toBe(3);
    expect(computeVolatility(data[2])).toBe(0);
  });

  it('applies min EV and arbitrage-only filters', () => {
    const opts: FilterOptions = { minEvPercent: 4, onlyArbToggle: true };
    const res = applyFilters(data, opts);
    expect(res.map((r) => r.id)).toEqual(['a']);
  });

  it('applies volatility threshold', () => {
    const opts: FilterOptions = { volatilityMin: 10 };
    const res = applyFilters(data, opts);
    expect(res.map((r) => r.id)).toEqual(['a']);
  });

  it('filters by sport and bookmarks', () => {
    const opts: FilterOptions = { sports: ['NBA'], bookmarkedOnly: true };
    const res = applyFilters(data, opts);
    expect(res.map((r) => r.id)).toEqual(['a']);
  });
});
