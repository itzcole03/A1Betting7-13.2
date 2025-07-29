/**
 * MLB Odds & AI Insights Mapping Logic (A1Betting7-13.2)
 *
 * This file is responsible for fetching, mapping, and surfacing MLB odds and AI insights
 * in the frontend analytics table. The workflow is as follows:
 *
 * 1. Data Fetch:
 *    - The function `fetchFeaturedProps('MLB')` fetches odds data from the backend endpoint `/mlb/odds-comparison/`.
 *    - The backend may return multiple rows per event, especially for "totals" (e.g., Total Runs),
 *      with separate rows for "Over" and "Under" bets.
 *
 * 2. Grouping & Merging (for "totals"):
 *    - All rows with `stat_type === 'totals'` are grouped by `event_id`, `stat_type`, and line value.
 *    - For each group, the Over and Under odds are merged into a single object with both `overOdds` and `underOdds` fields.
 *    - The "Player Name" column for these rows is set to the event name, matchup, or a fallback like "Total (Game)".
 *    - This ensures only one row per prop is shown in the table, with both Over/Under odds and a meaningful label.
 *
 * 3. Non-totals:
 *    - All other props (e.g., spreads, h2h) are mapped as before, with player/team logic to ensure a user-friendly label.
 *
 * 4. Mapping Output:
 *    - Each mapped prop includes: id, player (display name), matchup, stat, line, overOdds, underOdds, confidence, sport, gameTime, pickType.
 *    - Diagnostic logs are output for each mapped prop for troubleshooting.
 *
 * 5. Table Display:
 *    - The frontend table displays one row per prop, with correct odds and a clear, user-friendly name for each.
 *
 * If you need to adjust the mapping, always ensure:
 *    - "Player Name" is never "Over" or "Under" for totals.
 *    - Only one row per prop is shown for totals, with both odds present.
 *    - Diagnostic logs are checked for edge cases or missing data.
 *
 * For further details, see the README and API documentation.
 */
// Batch prediction using backend-side batching and caching
export async function fetchBatchPredictions(props: FeaturedProp[]): Promise<any[]> {
  // Map FeaturedProp to the minimal prop dict expected by backend
  const propPayload = props.map(p => ({
    id: p.id,
    player: p.player,
    stat: p.stat,
    line: p.line,
    overOdds: p.overOdds,
    underOdds: p.underOdds,
    confidence: p.confidence,
    sport: p.sport,
    gameTime: p.gameTime,
    pickType: p.pickType,
  }));
  const res = await axios.post('/api/unified/batch-predictions', propPayload);
  if (Array.isArray(res.data?.predictions)) {
    return res.data.predictions;
  }
  return [];
}
import axios from 'axios';

export interface FeaturedProp {
  id: string;
  player: string;
  matchup: string;
  stat: string;
  line: number;
  overOdds: number;
  underOdds: number;
  confidence: number;
  sport: string;
  gameTime: string;
  pickType: string;
}

export async function fetchFeaturedProps(sport?: string): Promise<FeaturedProp[]> {
  if (sport === 'MLB') {
    // Fetch MLB odds from the dedicated backend endpoint
    const res = await axios.get('/mlb/odds-comparison/');
    console.log('[MLB][RAW BACKEND RESPONSE]', res.data);
    let arr: any[] = [];
    if (Array.isArray(res.data)) {
      arr = res.data;
    } else if (Array.isArray(res.data?.data)) {
      arr = res.data.data;
    }
    // Group totals by event_id, stat_type, and line (or line_score)
    const norm = (v: any) => (typeof v === 'string' ? v.trim().toLowerCase() : v);
    const totalsMap = new Map();
    const nonTotals: any[] = [];
    for (const item of arr) {
      if (norm(item.stat_type) === 'totals') {
        // Use event_id, stat_type, and line as key
        const key = [item.event_id, item.stat_type, item.line_score ?? item.line ?? 0].join('|');
        if (!totalsMap.has(key)) {
          totalsMap.set(key, {
            event_id: item.event_id,
            provider_id: item.provider_id,
            stat_type: item.stat_type,
            event_name: item.event_name,
            matchup: item.matchup,
            team_name: item.team_name,
            opponent_name: item.opponent_name,
            line:
              typeof item.line_score === 'number'
                ? item.line_score
                : typeof item.line === 'number'
                ? item.line
                : 0,
            start_time: item.start_time,
            overOdds: 0,
            underOdds: 0,
            confidence: typeof item.confidence === 'number' ? item.confidence : 0,
            odds: item.odds,
          });
        }
        const group = totalsMap.get(key);
        // Fill over/under odds
        if (Array.isArray(item.odds)) {
          for (const o of item.odds) {
            if (norm(o.team_name) === 'over')
              group.overOdds = typeof o.value === 'number' ? o.value : 0;
            if (norm(o.team_name) === 'under')
              group.underOdds = typeof o.value === 'number' ? o.value : 0;
          }
        } else {
          if (norm(item.team_name) === 'over')
            group.overOdds = typeof item.value === 'number' ? item.value : 0;
          if (norm(item.team_name) === 'under')
            group.underOdds = typeof item.value === 'number' ? item.value : 0;
        }
      } else {
        nonTotals.push(item);
      }
    }
    // Map grouped totals
    const mappedTotals = Array.from(totalsMap.values()).map(item => {
      // Player name: event_name, matchup, or Total (Game)
      let displayPlayer =
        item.event_name || item.matchup || item.team_name || item.opponent_name || 'Total (Game)';
      if (!displayPlayer || ['over', 'under'].includes(norm(displayPlayer))) {
        displayPlayer = 'Total (Game)';
      }
      const matchup =
        item.event_name ||
        item.matchup ||
        (item.team_name && item.opponent_name
          ? `${item.team_name} vs ${item.opponent_name}`
          : '') ||
        'N/A';
      let stat = item.stat_type || 'Unknown';
      let pickType = stat;
      if (stat === 'totals') {
        stat = 'Total Runs';
        pickType = 'Total Runs';
      }
      const line = item.line;
      const confidence = typeof item.confidence === 'number' ? item.confidence : 0;
      const id = [item.event_id, item.provider_id, item.stat_type, displayPlayer]
        .filter(Boolean)
        .join('-');
      const mapped = {
        id,
        player: displayPlayer,
        matchup,
        stat,
        line,
        overOdds: item.overOdds,
        underOdds: item.underOdds,
        confidence,
        sport: 'MLB',
        gameTime: item.start_time || '',
        pickType,
      };
      console.log('[MLB][MAPPED TOTALS PROP]', mapped, 'RAW GROUP:', item);
      return mapped;
    });
    // Map non-totals as before
    const mappedNonTotals = nonTotals.map(item => {
      let player = item.player_name;
      let isTeam = false;
      if (!player || ['over', 'under'].includes(norm(player))) {
        if (item.team_name && !['over', 'under'].includes(norm(item.team_name))) {
          player = item.team_name;
          isTeam = true;
        } else {
          player = item.player_name || item.team_name || 'N/A';
        }
      }
      let displayPlayer = isTeam ? `${player} (Team)` : player;
      if (!displayPlayer || displayPlayer === 'N/A') {
        console.warn('[MLB][WARN] Missing display player/team name in odds item:', item);
      }
      const matchup =
        item.event_name ||
        item.matchup ||
        (item.team_name && item.opponent_name
          ? `${item.team_name} vs ${item.opponent_name}`
          : '') ||
        'N/A';
      let stat = item.stat_type || 'Unknown';
      let pickType = stat;
      if (stat === 'spreads') {
        stat = 'Point Spread';
        pickType = 'Point Spread';
      } else if (stat === 'h2h') {
        stat = 'Moneyline';
        pickType = 'Moneyline';
      }
      const line =
        typeof item.line_score === 'number'
          ? item.line_score
          : typeof item.line === 'number'
          ? item.line
          : 0;
      let overOdds = typeof item.value === 'number' ? item.value : 0;
      let underOdds = 0;
      const confidence = typeof item.confidence === 'number' ? item.confidence : 0;
      const id = [item.event_id, item.provider_id, item.stat_type, displayPlayer]
        .filter(Boolean)
        .join('-');
      const mapped = {
        id,
        player: displayPlayer,
        matchup,
        stat,
        line,
        overOdds,
        underOdds,
        confidence,
        sport: 'MLB',
        gameTime: item.start_time || '',
        pickType,
      };
      console.log('[MLB][MAPPED NON-TOTALS PROP]', mapped, 'RAW:', item);
      return mapped;
    });
    return [...mappedTotals, ...mappedNonTotals];
  }
  return [];
}
