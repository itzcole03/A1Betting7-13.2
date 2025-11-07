/* Worker to map raw opportunity payload into a lightweight PropOpportunity shape
   and stream mapped batches back to the main thread.

   This worker avoids importing large client modules and implements a small,
   defensive mapper for only commonly-used fields to keep its bundle tiny.
*/

interface RawRec {
  [key: string]: any;
}

interface PropOpportunity {
  id: string;
  player?: string;
  team?: string;
  opponent?: string;
  sport?: string;
  market?: string;
  pick?: string;
  line?: number;
  odds?: number;
  aiProbability?: number;
  confidence?: number;
  lastUpdated?: string;
  [key: string]: any;
}

function toStringValue(value: any): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
}

function toNumberValue(value: any): number | undefined {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mapOne(raw: RawRec): PropOpportunity {
  const id =
    toStringValue(raw.id) ||
    toStringValue(raw.opportunityId) ||
    toStringValue(raw.opportunity_id) ||
    `opp-${Math.random().toString(36).slice(2, 10)}`;
  const out: PropOpportunity = {
    id,
    player: toStringValue(raw.player ?? raw.player_name),
    team: toStringValue(raw.team ?? raw.team_name),
    opponent: toStringValue(raw.opponent ?? raw.opponent_name),
    sport: toStringValue(raw.sport ?? raw.league),
    market: toStringValue(raw.market ?? raw.market_type ?? raw.stat),
    pick: toStringValue(raw.pick ?? raw.side),
    line: toNumberValue(raw.line ?? raw.projected_line ?? raw.threshold),
    odds: toNumberValue(raw.odds ?? raw.bestOdds ?? raw.price),
    aiProbability: toNumberValue(raw.aiProbability ?? raw.ai_probability),
    confidence: toNumberValue(raw.confidence ?? raw.confidence_pct),
    lastUpdated: toStringValue(raw.lastUpdated ?? raw.last_updated),
  };
  return out;
}

self.onmessage = function (ev: MessageEvent) {
  const data = ev.data || {};
  const opps: any[] = Array.isArray(data.opps) ? data.opps : [];
  const batchSize = Number(data.batchSize) || 50;

  try {
    let i = 0;
    while (i < opps.length) {
      const slice = opps.slice(i, i + batchSize);
      const mapped = slice.map(mapOne);
      // Post a batch back to the main thread
      // We explicitly use structured cloning so worker messages stay fast
      postMessage({ type: 'batch', items: mapped });
      i += batchSize;
    }
    postMessage({ type: 'done' });
  } catch (e) {
    // On error, send a final 'done' so main thread can gracefully fallback
    try {
      postMessage({ type: 'done' });
    } catch (_e) {
      // ignore
    }
  }
};
