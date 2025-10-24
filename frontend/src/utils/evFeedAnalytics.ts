import { EVOpportunity, EVTier } from '../types/ev-types';

export interface EvFeedSummary {
  total: number;
  averageEv: number;
  topEv: number;
  uniqueBooks: number;
  uniqueMarkets: number;
  tierBreakdown: Record<EVTier, number>;
}

export function computeEvSummary(opportunities: EVOpportunity[]): EvFeedSummary {
  if (opportunities.length === 0) {
    return {
      total: 0,
      averageEv: 0,
      topEv: 0,
      uniqueBooks: 0,
      uniqueMarkets: 0,
      tierBreakdown: {
        [EVTier.LOW]: 0,
        [EVTier.MEDIUM]: 0,
        [EVTier.HIGH]: 0,
        [EVTier.EXTREME]: 0,
      },
    };
  }

  let totalEv = 0;
  let topEv = -Infinity;
  const books = new Set<string>();
  const markets = new Set<string>();
  const tierBreakdown: Record<EVTier, number> = {
    [EVTier.LOW]: 0,
    [EVTier.MEDIUM]: 0,
    [EVTier.HIGH]: 0,
    [EVTier.EXTREME]: 0,
  };

  opportunities.forEach(opportunity => {
    const ev = Number(opportunity.ev_percent ?? 0);
    totalEv += ev;
    if (ev > topEv) {
      topEv = ev;
    }
    if (opportunity.source_book) {
      books.add(opportunity.source_book);
    }
    if (opportunity.market) {
      markets.add(opportunity.market);
    }
    if (opportunity.ev_tier && tierBreakdown[opportunity.ev_tier as EVTier] !== undefined) {
      tierBreakdown[opportunity.ev_tier as EVTier] += 1;
    }
  });

  return {
    total: opportunities.length,
    averageEv: totalEv / opportunities.length,
    topEv: topEv === -Infinity ? 0 : topEv,
    uniqueBooks: books.size,
    uniqueMarkets: markets.size,
    tierBreakdown,
  };
}

export interface EvHistorySnapshot {
  timestamp: number;
  count: number;
  averageEv: number;
  topEv: number;
}

export function createHistorySnapshotFromSummary(summary: EvFeedSummary): EvHistorySnapshot {
  return {
    timestamp: Date.now(),
    count: summary.total,
    averageEv: summary.averageEv,
    topEv: summary.topEv,
  };
}

export function appendHistorySnapshot(
  history: EvHistorySnapshot[],
  opportunities: EVOpportunity[],
  limit: number = 30,
  summary?: EvFeedSummary
): EvHistorySnapshot[] {
  const computedSummary = summary ?? computeEvSummary(opportunities);
  const snapshot = createHistorySnapshotFromSummary(computedSummary);
  return [...history, snapshot].slice(-limit);
}
