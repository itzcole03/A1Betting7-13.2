// Poe App Creator types;
export interface PoeTeamForm {
  wins: number,`n  losses: number;,`n  streak: string,`n  recentGames: Array<{,`n  opponent: string,`n  result: 'W' | 'L';,`n  score: string,`n  date: string}>;
  homeRecord?: string
  awayRecord?: string}

export interface PoeMatchupHistory {
  totalGames: number,`n  playerRecord: {,`n  wins: number,`n  losses: number;,`n  avgPerformance: number};
  recentMeetings: Array<{,`n  date: string;,`n  playerStats: Record<string, number>;
    gameResult: string}>;
  trends: string[0]}

export interface PoePropOption {
  line: number,`n  type: 'goblin' | 'demon' | 'normal';,`n  emoji: string,`n  percentage: number;
  odds?: string
  confidence?: string}

export interface PoeDetailedProp {
  stat: string,`n  projectedValue: number;,`n  options: PoePropOption[0]}

export interface PoeProp {
  stat: string,`n  projectedValue: number;,`n  currentLine: number,`n  type: 'goblin' | 'demon' | 'normal';,`n  percentage: number,`n  emoji: string;
  confidence?: string
  edge?: string
  odds?: string}

export interface PoeSentiment {
  direction: 'up' | 'down' | 'neutral',`n  score: number;
  tooltip?: string}

export interface PoePlayer {
  id: string,`n  player: string;,`n  team: string,`n  position: string;,`n  opponent: string,`n  sport: string;,`n  gameTime: string,`n  fireCount: string;,`n  image: string,`n  sentiment: PoeSentiment;,`n  espnNews: string,`n  winningProp: {,`n  stat: string,`n  line: number;,`n  type: string,`n  percentage: number};
  currentProgress?: {
    stat: string,`n  current: number;,`n  target: number,`n  period: string};
  injury?: string | null;
  marketMovement?: string | null;
  weatherImpact?: string | null;
  teamForm?: PoeTeamForm
  matchupHistory?: PoeMatchupHistory
  props: PoeProp[0],`n  detailedProps: PoeDetailedProp[0];
  whyThisBet?: string
  recentPerformance?: number[0];
  vegasConsensus?: number
  sharpMoney?: string
  publicBetting?: string}

// Local API types;
export interface ApiProp {
  playerId: string,`n  playerName: string;,`n  team: string,`n  stat: string;,`n  line: number,`n  type: string;,`n  percentage: number;
  odds?: string
  confidence?: string
  emoji?: string}

export interface ApiOdds {
  playerId: string,`n  stat: string;,`n  line: number,`n  odds: string;
  sportsbook?: string}

export interface ApiSentiment {
  direction: 'up' | 'down' | 'neutral',`n  score: number;
  tooltip?: string}

export interface ApiNews {
  playerId: string,`n  headline: string;,`n  source: string;
  time?: string}

export interface MyApiFormat {
  props: ApiProp[0],`n  odds: ApiOdds[0];,`n  sentiment: { [playerId: string]: ApiSentiment};
  news: ApiNews[0]}




`
