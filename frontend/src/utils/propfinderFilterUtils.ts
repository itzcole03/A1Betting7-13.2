import { PropOpportunity } from '../hooks/usePropFinderData';

export type Range = [number, number];

export interface FilterOptions {
  search?: string;
  sports?: string[];
  confidenceRange?: Range;
  edgeRange?: Range;
  evRange?: Range;
  evTiers?: string[];
  arbitrageOnly?: boolean;
  onlyArbToggle?: boolean;
  lowJuiceOnly?: boolean;
  minBookmakers?: number;
  sharpMoney?: string[];
  minEvPercent?: number;
  bookmarkedOnly?: boolean;
  volatilityMin?: number;
}

export function computeVolatility(opp: PropOpportunity): number {
  const series = Array.isArray(opp.recentForm) ? opp.recentForm : [];
  if (series.length < 2) return 0;
  const maxV = Math.max(...series);
  const minV = Math.min(...series);
  return maxV - minV;
}

export function applyFilters(opportunities: PropOpportunity[], opts: FilterOptions): PropOpportunity[] {
  const search = (opts.search || '').toLowerCase();
  const sports = opts.sports || [];
  const confidenceRange = opts.confidenceRange || [0, 100];
  const edgeRange = opts.edgeRange || [-100, 100];
  const evRange = opts.evRange || [-100, 100];
  const evTiers = opts.evTiers || [];
  const arbitrageOnly = !!opts.arbitrageOnly;
  const onlyArbToggle = !!opts.onlyArbToggle;
  const lowJuiceOnly = !!opts.lowJuiceOnly;
  const minBookmakers = opts.minBookmakers || 0;
  const sharpMoney = opts.sharpMoney || [];
  const minEvPercent = opts.minEvPercent ?? -100;
  const bookmarkedOnly = !!opts.bookmarkedOnly;
  const volatilityMin = opts.volatilityMin ?? 0;

  return opportunities.filter((opp) => {
    const matchesSearch = !search ||
      opp.player.toLowerCase().includes(search) ||
      (opp.market || '').toLowerCase().includes(search) ||
      (opp.team || '').toLowerCase().includes(search);

    const matchesSports = sports.length === 0 || sports.includes(opp.sport || '');
    const conf = opp.confidence || 0;
    const edge = opp.edge || 0;
    const evPct = opp.evPercent ?? 0;

    const matchesConfidence = conf >= confidenceRange[0] && conf <= confidenceRange[1];
    const matchesEdge = edge >= edgeRange[0] && edge <= edgeRange[1];
    const matchesEvRange = evPct >= evRange[0] && evPct <= evRange[1];
    const matchesEvTier = evTiers.length === 0 || evTiers.includes(opp.evTier || 'negative');
    const matchesArbitrage = (!arbitrageOnly || opp.hasArbitrage) && (!onlyArbToggle || opp.hasArbitrage);
    const matchesLowJuice = !lowJuiceOnly || !!opp.isLowJuice;
    const matchesBookmakers = !opp.numBookmakers || opp.numBookmakers >= minBookmakers;
    const matchesSharpMoney = sharpMoney.length === 0 || sharpMoney.includes(opp.sharpMoney || '');
    const matchesEvPercent = evPct >= minEvPercent;
    const matchesBookmarked = !bookmarkedOnly || !!opp.isBookmarked;
    const volatility = computeVolatility(opp);
    const matchesVolatility = volatility >= volatilityMin;

    return matchesSearch && matchesSports && matchesConfidence && matchesEdge &&
      matchesEvRange && matchesEvTier && matchesArbitrage && matchesLowJuice &&
      matchesBookmakers && matchesSharpMoney && matchesEvPercent && matchesBookmarked &&
      matchesVolatility;
  });
}
