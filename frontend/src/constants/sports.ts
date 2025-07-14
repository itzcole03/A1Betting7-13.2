export interface SportConfig {
  id: string;
  name: string;
  emoji: string;
  displayName: string;
  category: 'major' | 'emerging' | 'international';
  season: {
    start: string; // MM-DD format
    end: string;
    active: boolean;
  };
  leagues: string[];
  popularMarkets: string[];
  fantasyAvailable: boolean;
  liveBettingAvailable: boolean;
  color: {
    primary: string;
    secondary: string;
  };
}

// Comprehensive sports configuration with 8+ sports
export const SPORTS_CONFIG: SportConfig[] = [
  {
    id: 'NBA',
    name: 'NBA',
    emoji: '🏀',
    displayName: 'NBA Basketball',
    category: 'major',
    season: {
      start: '10-15',
      end: '06-15',
      active: true,
    },
    leagues: ['NBA', 'G-League'],
    popularMarkets: ['Spread', 'Total', 'Moneyline', 'Player Props', 'Live'],
    fantasyAvailable: true,
    liveBettingAvailable: true,
    color: {
      primary: '#1d428a',
      secondary: '#c9082a',
    },
  },
  {
    id: 'WNBA',
    name: 'WNBA',
    emoji: '🏀',
    displayName: 'WNBA Basketball',
    category: 'major',
    season: {
      start: '05-15',
      end: '10-15',
      active: false,
    },
    leagues: ['WNBA'],
    popularMarkets: ['Spread', 'Total', 'Moneyline', 'Player Props'],
    fantasyAvailable: true,
    liveBettingAvailable: true,
    color: {
      primary: '#fe5000',
      secondary: '#000000',
    },
  },
  {
    id: 'NFL',
    name: 'NFL',
    emoji: '🏈',
    displayName: 'NFL Football',
    category: 'major',
    season: {
      start: '09-01',
      end: '02-15',
      active: true,
    },
    leagues: ['NFL'],
    popularMarkets: ['Spread', 'Total', 'Moneyline', 'Player Props', 'Futures', 'Live'],
    fantasyAvailable: true,
    liveBettingAvailable: true,
    color: {
      primary: '#013369',
      secondary: '#d50a0a',
    },
  },
  {
    id: 'MLB',
    name: 'MLB',
    emoji: '⚾',
    displayName: 'MLB Baseball',
    category: 'major',
    season: {
      start: '03-28',
      end: '10-31',
      active: false,
    },
    leagues: ['MLB', 'Minor League'],
    popularMarkets: ['Moneyline', 'Run Line', 'Total', 'Player Props', 'Futures'],
    fantasyAvailable: true,
    liveBettingAvailable: true,
    color: {
      primary: '#041e42',
      secondary: '#bf0d3e',
    },
  },
  {
    id: 'NHL',
    name: 'NHL',
    emoji: '🏒',
    displayName: 'NHL Hockey',
    category: 'major',
    season: {
      start: '10-04',
      end: '06-30',
      active: true,
    },
    leagues: ['NHL', 'AHL'],
    popularMarkets: ['Moneyline', 'Puck Line', 'Total', 'Player Props', 'Period Betting'],
    fantasyAvailable: true,
    liveBettingAvailable: true,
    color: {
      primary: '#000000',
      secondary: '#c8102e',
    },
  },
  {
    id: 'Soccer',
    name: 'Soccer',
    emoji: '⚽',
    displayName: 'Soccer/Football',
    category: 'international',
    season: {
      start: '08-01',
      end: '05-31',
      active: true,
    },
    leagues: ['Premier League', 'Champions League', 'MLS', 'La Liga', 'Bundesliga', 'Serie A'],
    popularMarkets: ['Moneyline', 'Draw', 'Total Goals', 'Both Teams Score', 'Correct Score'],
    fantasyAvailable: true,
    liveBettingAvailable: true,
    color: {
      primary: '#00a651',
      secondary: '#ffffff',
    },
  },
  {
    id: 'MMA',
    name: 'MMA',
    emoji: '🥊',
    displayName: 'MMA/UFC',
    category: 'emerging',
    season: {
      start: '01-01',
      end: '12-31',
      active: true,
    },
    leagues: ['UFC', 'Bellator', 'ONE Championship', 'PFL'],
    popularMarkets: ['Moneyline', 'Method of Victory', 'Round Betting', 'Fight Props'],
    fantasyAvailable: true,
    liveBettingAvailable: true,
    color: {
      primary: '#d20a0a',
      secondary: '#000000',
    },
  },
  {
    id: 'PGA',
    name: 'PGA',
    emoji: '🏌️',
    displayName: 'PGA Golf',
    category: 'major',
    season: {
      start: '01-01',
      end: '12-31',
      active: true,
    },
    leagues: ['PGA Tour', 'LIV Golf', 'European Tour', 'Champions Tour'],
    popularMarkets: ['Outright Winner', 'Top 5/10/20', 'Head-to-Head', 'Cut Made'],
    fantasyAvailable: true,
    liveBettingAvailable: false,
    color: {
      primary: '#006847',
      secondary: '#ffcd00',
    },
  },
  {
    id: 'Tennis',
    name: 'Tennis',
    emoji: '🎾',
    displayName: 'Tennis',
    category: 'international',
    season: {
      start: '01-01',
      end: '12-31',
      active: true,
    },
    leagues: ['ATP', 'WTA', 'Grand Slams', 'Challengers'],
    popularMarkets: ['Moneyline', 'Set Betting', 'Game Handicap', 'Total Games'],
    fantasyAvailable: false,
    liveBettingAvailable: true,
    color: {
      primary: '#ffff00',
      secondary: '#00a651',
    },
  },
  {
    id: 'Esports',
    name: 'Esports',
    emoji: '🎮',
    displayName: 'Esports',
    category: 'emerging',
    season: {
      start: '01-01',
      end: '12-31',
      active: true,
    },
    leagues: ['League of Legends', 'CS2', 'Dota 2', 'Valorant', 'Overwatch'],
    popularMarkets: ['Moneyline', 'Map Betting', 'Total Maps', 'First Blood', 'Special Props'],
    fantasyAvailable: true,
    liveBettingAvailable: true,
    color: {
      primary: '#7b68ee',
      secondary: '#ff1493',
    },
  },
  {
    id: 'Boxing',
    name: 'Boxing',
    emoji: '🥊',
    displayName: 'Boxing',
    category: 'emerging',
    season: {
      start: '01-01',
      end: '12-31',
      active: true,
    },
    leagues: ['Professional Boxing', 'Amateur Boxing'],
    popularMarkets: ['Moneyline', 'Method of Victory', 'Round Betting', 'Total Rounds'],
    fantasyAvailable: false,
    liveBettingAvailable: true,
    color: {
      primary: '#b8860b',
      secondary: '#000000',
    },
  },
  {
    id: 'Formula1',
    name: 'Formula1',
    emoji: '🏎️',
    displayName: 'Formula 1',
    category: 'international',
    season: {
      start: '03-01',
      end: '12-01',
      active: true,
    },
    leagues: ['Formula 1', 'Formula 2', 'Formula 3'],
    popularMarkets: ['Race Winner', 'Podium Finish', 'Points Finish', 'Head-to-Head'],
    fantasyAvailable: true,
    liveBettingAvailable: false,
    color: {
      primary: '#e10600',
      secondary: '#ffffff',
    },
  },
];

// Helper functions
export const getAllSports = (): SportConfig[] => SPORTS_CONFIG;

export const getSportById = (id: string): SportConfig | undefined => {
  return SPORTS_CONFIG.find(sport => sport.id === id);
};

export const getSportNames = (): string[] => {
  return SPORTS_CONFIG.map(sport => sport.id);
};

export const getSportNamesWithAll = (): string[] => {
  return ['All', ...getSportNames()];
};

export const getSportsByCategory = (category: SportConfig['category']): SportConfig[] => {
  return SPORTS_CONFIG.filter(sport => sport.category === category);
};

export const getActiveSports = (): SportConfig[] => {
  return SPORTS_CONFIG.filter(sport => sport.season.active);
};

export const getFantasySports = (): SportConfig[] => {
  return SPORTS_CONFIG.filter(sport => sport.fantasyAvailable);
};

export const getLiveBettingSports = (): SportConfig[] => {
  return SPORTS_CONFIG.filter(sport => sport.liveBettingAvailable);
};

export const getSportEmoji = (id: string): string => {
  const sport = getSportById(id);
  return sport ? sport.emoji : '🏆';
};

export const getSportDisplayName = (id: string): string => {
  if (id === 'All') return '🌐 All Sports';
  const sport = getSportById(id);
  return sport ? `${sport.emoji} ${sport.displayName}` : id;
};

export const getSportColor = (id: string): { primary: string; secondary: string } => {
  const sport = getSportById(id);
  return sport ? sport.color : { primary: '#06ffa5', secondary: '#00ff88' };
};

export const getSportMarkets = (id: string): string[] => {
  const sport = getSportById(id);
  return sport ? sport.popularMarkets : [];
};

// Enhanced filtering options
export const SPORT_CATEGORIES = [
  { id: 'all', label: 'All Categories', count: SPORTS_CONFIG.length },
  { id: 'major', label: 'Major Sports', count: getSportsByCategory('major').length },
  { id: 'emerging', label: 'Emerging Sports', count: getSportsByCategory('emerging').length },
  {
    id: 'international',
    label: 'International',
    count: getSportsByCategory('international').length,
  },
];

export const SEASON_FILTERS = [
  { id: 'all', label: 'All Seasons' },
  { id: 'active', label: 'In Season', count: getActiveSports().length },
  { id: 'fantasy', label: 'Fantasy Available', count: getFantasySports().length },
  { id: 'live', label: 'Live Betting', count: getLiveBettingSports().length },
];

// Export for use in components
export const SPORT_OPTIONS = getSportNamesWithAll();
export const MAJOR_SPORTS = getSportsByCategory('major').map(s => s.id);
export const EMERGING_SPORTS = getSportsByCategory('emerging').map(s => s.id);
export const INTERNATIONAL_SPORTS = getSportsByCategory('international').map(s => s.id);

// Market types across all sports
export const ALL_MARKET_TYPES = [
  'Moneyline',
  'Spread',
  'Total',
  'Player Props',
  'Futures',
  'Live',
  'Period Betting',
  'Head-to-Head',
  'Special Props',
];

// Popular sport combinations for multi-sport betting
export const SPORT_COMBINATIONS = [
  { id: 'big4', label: 'Big 4 Sports', sports: ['NBA', 'NFL', 'MLB', 'NHL'] },
  { id: 'basketball', label: 'Basketball', sports: ['NBA', 'WNBA'] },
  { id: 'combat', label: 'Combat Sports', sports: ['MMA', 'Boxing'] },
  { id: 'motorsports', label: 'Motorsports', sports: ['Formula1'] },
  { id: 'fantasy', label: 'Fantasy Sports', sports: getFantasySports().map(s => s.id) },
];
