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
  const params = sport && sport !== 'All' ? `?sport=${encodeURIComponent(sport)}` : '';
  const res = await axios.get(`/api/props/featured${params}`);
  let arr: any[] = [];
  if (Array.isArray(res.data)) {
    arr = res.data;
  } else if (Array.isArray(res.data?.data)) {
    arr = res.data.data;
  }
  // Map backend fields to frontend FeaturedProp fields
  return arr.map(item => ({
    id: item.id,
    player: item.player_name || item.player || 'Unknown',
    matchup: item.team || item.matchup || 'Unknown',
    stat: item.stat_type || item.stat || 'Unknown',
    line: item.line_score ?? item.line ?? 0,
    overOdds: item.over_odds ?? item.overOdds ?? 0,
    underOdds: item.under_odds ?? item.underOdds ?? 0,
    confidence: item.confidence ?? 0,
    sport: item.sport || 'Unknown',
    gameTime: item.game_time || item.gameTime || '',
    pickType: item.pick_type || item.pickType || '',
  }));
}
